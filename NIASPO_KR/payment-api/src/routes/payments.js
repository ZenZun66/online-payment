const express = require('express');
const router = express.Router();
const db = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

// Middleware для измерения времени выполнения запросов
const measureDuration = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    metrics.httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });
  next();
};

router.use(measureDuration);

// Создание таблицы платежей (если не существует)
const initDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'RUB',
        status VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50),
        customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query('CREATE INDEX IF NOT EXISTS idx_transaction_id ON payments(transaction_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_customer_id ON payments(customer_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_status ON payments(status)');
    
    logger.info('Database tables initialized');
  } catch (error) {
    logger.error('Database initialization error:', error);
  }
};

initDatabase();

// POST /api/payments - Создание нового платежа
router.post('/', async (req, res, next) => {
  try {
    const { amount, currency, payment_method, customer_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const status = 'pending';

    // Сохранение в базу данных
    const result = await db.query(
      `INSERT INTO payments (transaction_id, amount, currency, status, payment_method, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [transaction_id, amount, currency || 'RUB', status, payment_method, customer_id]
    );

    const payment = result.rows[0];

    // Кеширование в Redis на 1 час
    try {
      await redis.setEx(
        `payment:${transaction_id}`,
        3600,
        JSON.stringify(payment)
      );
    } catch (redisError) {
      logger.warn('Redis cache failed, continuing without cache:', redisError.message);
    }

    // Метрики
    metrics.paymentTransactions.labels(status).inc();
    metrics.paymentAmount.observe(parseFloat(amount));

    logger.info('Payment created', { transaction_id, amount });

    // Симуляция обработки платежа
    setTimeout(async () => {
      const finalStatus = Math.random() > 0.1 ? 'completed' : 'failed';
      await db.query(
        `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE transaction_id = $2`,
        [finalStatus, transaction_id]
      );
      try {
        await redis.setEx(
          `payment:${transaction_id}`,
          3600,
          JSON.stringify({ ...payment, status: finalStatus })
        );
      } catch (redisError) {
        logger.warn('Redis cache update failed:', redisError.message);
      }
      metrics.paymentTransactions.labels(finalStatus).inc();
      logger.info('Payment status updated', { transaction_id, status: finalStatus });
    }, 2000);

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error creating payment:', error);
    next(error);
  }
});

// GET /api/payments/:transaction_id - Получение информации о платеже
router.get('/:transaction_id', async (req, res, next) => {
  try {
    const { transaction_id } = req.params;

    // Попытка получить из кеша
    let cached = null;
    try {
      cached = await redis.get(`payment:${transaction_id}`);
    } catch (redisError) {
      logger.warn('Redis get failed, continuing without cache:', redisError.message);
    }
    
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Получение из базы данных
    const result = await db.query(
      'SELECT * FROM payments WHERE transaction_id = $1',
      [transaction_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = result.rows[0];

    // Кеширование результата
    try {
      await redis.setEx(
        `payment:${transaction_id}`,
        3600,
        JSON.stringify(payment)
      );
    } catch (redisError) {
      logger.warn('Redis cache failed, continuing without cache:', redisError.message);
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error getting payment:', error);
    next(error);
  }
});

// GET /api/payments - Получение списка платежей
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    let query = 'SELECT * FROM payments';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error getting payments:', error);
    next(error);
  }
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const db = require('./config/database');
const redis = require('./config/redis');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');
const metrics = require('./utils/metrics');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка trust proxy для работы за reverse proxy (Nginx)
app.set('trust proxy', true);

// Middleware безопасности
app.use(helmet());
app.use(cors());

// Парсинг JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов с одного IP
});
app.use('/api/', limiter);

// Метрики Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Роуты
app.use('/api/payments', paymentRoutes);
app.use('/health', healthRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Инициализация подключений
async function startServer() {
  try {
    // Проверка подключения к PostgreSQL
    await db.query('SELECT NOW()');
    logger.info('PostgreSQL connection established');

    // Проверка подключения к Redis (подождем подключения с таймаутом)
    try {
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 5000))
      ]);
      logger.info('Redis connection established');
    } catch (redisError) {
      logger.warn('Redis not available, continuing without cache:', redisError.message);
      // Продолжаем работу даже если Redis недоступен
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Payment API server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await db.end();
  await redis.quit();
  process.exit(0);
});

startServer();

module.exports = app;

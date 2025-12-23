const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'payment_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Обработка ошибок подключения
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Обертка для логирования запросов
const originalQuery = pool.query.bind(pool);

pool.query = async function(query, params) {
  const start = Date.now();
  try {
    const res = await originalQuery(query, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { 
      query: typeof query === 'string' ? query.substring(0, 100) : 'prepared', 
      duration, 
      rows: res.rowCount 
    });
    return res;
  } catch (error) {
    logger.error('Database query error', { 
      error: error.message, 
      query: typeof query === 'string' ? query.substring(0, 100) : 'prepared' 
    });
    throw error;
  }
};

module.exports = pool;
const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max retry attempts reached');
        return false; // Остановить попытки
      }
      return Math.min(retries * 100, 3000);
    }
  },
  password: process.env.REDIS_PASSWORD || undefined
});

client.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

// Функция для подключения к Redis
async function connectRedis() {
  try {
    await client.connect();
    logger.info('Redis connection established');
    return client;
  } catch (err) {
    logger.error('Redis connection failed', err);
    throw err;
  }
}

// Подключаемся к Redis
connectRedis().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
});

module.exports = client;

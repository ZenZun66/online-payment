const client = require('prom-client');

// Создание реестра метрик
const register = new client.Registry();

// Добавление стандартных метрик
client.collectDefaultMetrics({ register });

// Кастомные метрики
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const paymentTransactions = new client.Counter({
  name: 'payment_transactions_total',
  help: 'Total number of payment transactions',
  labelNames: ['status']
});

const paymentAmount = new client.Histogram({
  name: 'payment_amount',
  help: 'Payment transaction amounts',
  buckets: [100, 500, 1000, 5000, 10000, 50000]
});

// Регистрация метрик
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(paymentTransactions);
register.registerMetric(paymentAmount);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  paymentTransactions,
  paymentAmount
};

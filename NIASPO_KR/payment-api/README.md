# Payment API

Микросервис для обработки платежных транзакций.

## Технологии

- Node.js 18
- Express.js
- PostgreSQL
- Redis
- Prometheus метрики

## Установка

```bash
npm install
```

## Запуск

### Разработка

```bash
npm run dev
```

### Production

```bash
npm start
```

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=redis
REDIS_PORT=6379
LOG_LEVEL=info
```

## API Endpoints

### Health Check

- `GET /health` - Проверка состояния сервиса
- `GET /health/live` - Проверка жизнеспособности
- `GET /health/ready` - Проверка готовности

### Payments

- `POST /api/payments` - Создание нового платежа
- `GET /api/payments` - Получение списка платежей
- `GET /api/payments/:transaction_id` - Получение информации о платеже

### Metrics

- `GET /metrics` - Prometheus метрики

## Примеры запросов

### Создание платежа

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.00,
    "currency": "RUB",
    "payment_method": "card",
    "customer_id": "customer_123"
  }'
```

### Получение платежа

```bash
curl http://localhost:3000/api/payments/TXN-1234567890-abcdefghi
```

# Сетевое межконтейнерное взаимодействие

## Архитектура сети

Система использует изолированную сеть Docker `payment-network` для обеспечения безопасного взаимодействия между контейнерами.

### Конфигурация сети

```yaml
networks:
  payment-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Схема взаимодействия

```
Internet
   │
   ▼
[Nginx:80] ──► [Payment API:3000] ──► [PostgreSQL:5432]
                      │
                      ├──► [Redis:6379]
                      │
                      └──► [RabbitMQ:5672]

[Prometheus:9090] ──► [Payment API:3000/metrics]
                         │
                         └──► [PostgreSQL]
                         └──► [Redis]

[Grafana:3000] ──► [Prometheus:9090]
```

## Детальное описание связей

### 1. Nginx → Payment API

**Назначение**: Балансировка нагрузки и маршрутизация запросов

**Конфигурация**:
- Nginx использует upstream блок для балансировки между несколькими инстансами Payment API
- Алгоритм балансировки: `least_conn` (наименьшее количество соединений)
- Health checks для автоматического исключения нерабочих инстансов

**Порты**:
- Nginx слушает на порту 80 (публичный)
- Payment API слушает на порту 3000 (внутренний)

### 2. Payment API → PostgreSQL

**Назначение**: Хранение данных о платежах

**Конфигурация**:
- Используется пул соединений (max: 20 соединений)
- Автоматическое переподключение при разрыве соединения
- Health checks для проверки доступности БД

**Параметры подключения**:
- Host: `postgres` (имя сервиса в Docker сети)
- Port: `5432`
- Database: `payment_db`
- User: `postgres`

### 3. Payment API → Redis

**Назначение**: Кеширование данных о платежах

**Конфигурация**:
- Кеширование результатов запросов на 1 час (3600 секунд)
- Использование для хранения сессий и временных данных
- Автоматическое переподключение при сбоях

**Параметры подключения**:
- Host: `redis` (имя сервиса в Docker сети)
- Port: `6379`

### 4. Payment API → RabbitMQ

**Назначение**: Асинхронная обработка платежных транзакций

**Конфигурация**:
- Очереди для обработки платежей
- Pub/Sub для уведомлений о статусах платежей

**Параметры подключения**:
- Host: `rabbitmq` (имя сервиса в Docker сети)
- Port: `5672` (AMQP)
- Management UI: `15672`

### 5. Prometheus → Payment API

**Назначение**: Сбор метрик производительности

**Эндпоинт**: `/metrics`

**Интервал сбора**: 10 секунд

**Метрики**:
- HTTP запросы (количество, длительность)
- Платежные транзакции
- Использование ресурсов

### 6. Grafana → Prometheus

**Назначение**: Визуализация метрик

**Источник данных**: Prometheus (http://prometheus:9090)

## Изоляция сети

### Внутренние сервисы (недоступны извне)

- PostgreSQL (порт 5432) - только внутри сети
- Redis (порт 6379) - только внутри сети
- RabbitMQ AMQP (порт 5672) - только внутри сети
- Prometheus (порт 9090) - только внутри сети (опционально можно открыть)

### Публичные сервисы

- Nginx (порты 80, 443) - публичный доступ
- Payment API (порт 3000) - опционально для прямого доступа
- Grafana (порт 3001) - административный доступ
- RabbitMQ Management (порт 15672) - административный доступ

## Безопасность сети

### 1. Изоляция контейнеров

Все контейнеры работают в изолированной сети `payment-network`, что предотвращает прямой доступ к ним из внешней сети.

### 2. Firewall правила в Nginx

```nginx
location /metrics {
    allow 172.20.0.0/16;  # Только внутренняя сеть
    deny all;
}
```

### 3. Rate Limiting

Nginx настроен с rate limiting для защиты от DDoS атак:

```nginx
limit_req_zone $binary_remote_addr zone=payment_limit:10m rate=5r/s;
```

### 4. HTTPS (рекомендуется для production)

Для production окружения рекомендуется настроить SSL/TLS сертификаты в Nginx.

## Мониторинг сетевого взаимодействия

### Проверка сетевых подключений

```bash
# Проверка сети
docker network inspect payment-network

# Проверка DNS разрешения имен
docker-compose exec payment-api nslookup postgres
docker-compose exec payment-api nslookup redis

# Проверка подключения к сервисам
docker-compose exec payment-api ping -c 3 postgres
docker-compose exec payment-api ping -c 3 redis
```

### Тестирование соединений

```bash
# Проверка подключения к PostgreSQL
docker-compose exec payment-api node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'payment_db',
  user: 'postgres',
  password: 'postgres'
});
pool.query('SELECT NOW()').then(res => {
  console.log('PostgreSQL connection OK:', res.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('PostgreSQL connection FAILED:', err.message);
  process.exit(1);
});
"

# Проверка подключения к Redis
docker-compose exec payment-api node -e "
const redis = require('redis');
const client = redis.createClient({ host: 'redis', port: 6379 });
client.connect().then(() => {
  console.log('Redis connection OK');
  client.quit();
  process.exit(0);
}).catch(err => {
  console.error('Redis connection FAILED:', err.message);
  process.exit(1);
});
"
```

## Docker Swarm сеть

В режиме Docker Swarm используется overlay сеть для обеспечения взаимодействия между контейнерами на разных узлах:

```yaml
networks:
  payment-network:
    driver: overlay
    attachable: true
```

### Преимущества overlay сети

- Автоматическое DNS разрешение имен сервисов
- Внутренняя маршрутизация между узлами кластера
- Шифрование трафика между узлами (опционально)
- Автоматическая балансировка нагрузки

## Troubleshooting

### Проблема: Контейнеры не могут найти друг друга

**Решение**:
1. Убедитесь, что все сервисы находятся в одной сети
2. Используйте имена сервисов вместо IP адресов
3. Проверьте DNS резолюцию: `docker-compose exec <service> nslookup <target-service>`

### Проблема: Соединение отклонено

**Решение**:
1. Проверьте, что целевой сервис запущен: `docker-compose ps`
2. Проверьте health checks: `docker-compose ps` должен показывать "healthy"
3. Проверьте логи: `docker-compose logs <service>`

### Проблема: Медленное соединение

**Решение**:
1. Проверьте использование ресурсов: `docker stats`
2. Увеличьте лимиты ресурсов в docker-compose.yml
3. Оптимизируйте размер пула соединений к БД

# Руководство по развертыванию

## Предварительные требования

- Docker версии 20.10 или выше
- Docker Compose версии 2.0 или выше
- Минимум 4GB RAM
- Минимум 10GB свободного места на диске

## Развертывание через Docker Compose

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd NIASPO_KR
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта (опционально, значения по умолчанию уже заданы):

```bash
cp payment-api/.env.example .env
```

### 3. Запуск системы

```bash
docker-compose up -d
```

Эта команда запустит все необходимые сервисы:
- PostgreSQL (основная база данных)
- PostgreSQL Replica (реплика для отказоустойчивости)
- Redis (кеш)
- Payment API (2 реплики)
- Nginx (reverse proxy)
- Prometheus (мониторинг)
- Grafana (визуализация)
- RabbitMQ (брокер сообщений)

### 4. Проверка статуса

```bash
docker-compose ps
```

### 5. Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f payment-api
```

### 6. Остановка системы

```bash
docker-compose down
```

Для удаления всех данных (volumes):

```bash
docker-compose down -v
```

## Развертывание через Docker Swarm

### 1. Инициализация Swarm кластера

```bash
docker swarm init
```

### 2. Сборка образа Payment API

```bash
cd payment-api
docker build -t payment-api:latest .
cd ..
```

### 3. Развертывание стека

```bash
docker stack deploy -c docker-swarm.yml payment-system
```

### 4. Проверка статуса

```bash
docker stack services payment-system
docker stack ps payment-system
```

### 5. Масштабирование сервисов

```bash
docker service scale payment-system_payment-api=5
```

### 6. Обновление сервиса

```bash
docker service update --image payment-api:new-version payment-system_payment-api
```

### 7. Удаление стека

```bash
docker stack rm payment-system
```

## Доступ к сервисам

После развертывания следующие сервисы будут доступны:

- **Payment API**: http://localhost:3000
- **Nginx**: http://localhost:80
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

## Проверка работоспособности

### Health Check API

```bash
curl http://localhost/health
```

### Тестовый платеж

```bash
curl -X POST http://localhost/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.00,
    "currency": "RUB",
    "payment_method": "card",
    "customer_id": "customer_123"
  }'
```

### Получение информации о платеже

```bash
curl http://localhost/api/payments/{transaction_id}
```

## Мониторинг

### Prometheus

Метрики доступны по адресу: http://localhost:9090

Основные метрики:
- `http_requests_total` - общее количество HTTP запросов
- `http_request_duration_seconds` - длительность HTTP запросов
- `payment_transactions_total` - общее количество платежных транзакций
- `payment_amount` - суммы платежей

### Grafana

Визуализация метрик доступна по адресу: http://localhost:3001

Для входа используйте:
- Username: `admin`
- Password: `admin`

Prometheus уже настроен как источник данных по умолчанию.

## Резервное копирование

### PostgreSQL

```bash
# Создание резервной копии
docker-compose exec postgres pg_dump -U postgres payment_db > backup.sql

# Восстановление из резервной копии
docker-compose exec -T postgres psql -U postgres payment_db < backup.sql
```

### Volumes

```bash
# Резервное копирование всех volumes
docker run --rm -v payment-postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Масштабирование

### Docker Compose

Для увеличения количества реплик Payment API:

```bash
docker-compose up -d --scale payment-api=5
```

### Docker Swarm

```bash
docker service scale payment-system_payment-api=5
```

## Устранение неполадок

### Проблемы с подключением к базе данных

```bash
# Проверка статуса PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Проверка подключения
docker-compose exec postgres psql -U postgres -d payment_db -c "SELECT version();"
```

### Проблемы с Redis

```bash
# Проверка статуса Redis
docker-compose exec redis redis-cli ping
```

### Очистка системы

```bash
# Остановка всех контейнеров
docker-compose down

# Удаление неиспользуемых образов
docker image prune -a

# Удаление всех volumes (ВНИМАНИЕ: удалит все данные)
docker-compose down -v
```

## Безопасность

### Рекомендации для production

1. Изменить все пароли по умолчанию
2. Использовать секреты Docker Swarm для хранения паролей
3. Настроить SSL/TLS сертификаты для Nginx
4. Ограничить доступ к портам базы данных только внутренней сетью
5. Регулярно обновлять образы Docker
6. Настроить firewall правила
7. Использовать VPN для доступа к административным интерфейсам

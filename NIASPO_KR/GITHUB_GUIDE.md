# Руководство по работе с GitHub

Это руководство поможет вам выгрузить свой проект курсовой работы в GitHub и настроить CI/CD pipeline.

## Создание репозитория на GitHub

### 1. Вход в GitHub

1. Откройте браузер и перейдите на https://github.com
2. Войдите в свой аккаунт или создайте новый, если его нет

### 2. Создание нового репозитория

1. Нажмите на кнопку **"+"** в правом верхнем углу
2. Выберите **"New repository"**
3. Заполните форму:
   - **Repository name**: `NIASPO_KR` (или другое название)
   - **Description**: "Настройка и администрирование отказоустойчивого решения для системы обработки платежей"
   - **Visibility**: выберите **Private** (приватный) или **Public** (публичный)
   - **НЕ** устанавливайте галочки "Add a README file", "Add .gitignore", "Choose a license" (они уже есть в проекте)
4. Нажмите **"Create repository"**

## Настройка Git в проекте

### 1. Инициализация Git репозитория

Откройте терминал (PowerShell на Windows) в папке проекта и выполните:

```bash
cd C:\NIASPO_KR
git init
```

### 2. Настройка пользователя Git (если еще не настроено)

```bash
git config --global user.name "Ваше Имя"
git config --global user.email "ваш.email@example.com"
```

### 3. Добавление файлов в Git

```bash
# Добавить все файлы
git add .

# Проверить, что будет добавлено
git status
```

### 4. Создание первого коммита

```bash
git commit -m "Initial commit: Курсовая работа по настройке и администрированию отказоустойчивого решения для системы обработки платежей"
```

## Подключение к GitHub репозиторию

### 1. Добавление remote репозитория

После создания репозитория на GitHub, скопируйте URL репозитория (он будет показан на странице созданного репозитория).

Пример URL:
- HTTPS: `https://github.com/ваш-username/NIASPO_KR.git`
- SSH: `git@github.com:ваш-username/NIASPO_KR.git`

Выполните команду (замените URL на ваш):

```bash
git remote add origin https://github.com/ваш-username/NIASPO_KR.git
```

### 2. Проверка подключения

```bash
git remote -v
```

Должны увидеть:
```
origin  https://github.com/ваш-username/NIASPO_KR.git (fetch)
origin  https://github.com/ваш-username/NIASPO_KR.git (push)
```

## Выгрузка кода на GitHub

### 1. Переименование ветки в main (если нужно)

```bash
git branch -M main
```

### 2. Выгрузка кода

```bash
git push -u origin main
```

Если GitHub попросит авторизацию:
- Для HTTPS: введите логин и Personal Access Token (не пароль!)
- Для SSH: настройте SSH ключи

### Создание Personal Access Token (для HTTPS)

1. Перейдите в GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Нажмите "Generate new token (classic)"
3. Назовите токен (например, "NIASPO_KR")
4. Выберите срок действия
5. Установите галочки: `repo` (полный доступ к репозиториям)
6. Нажмите "Generate token"
7. **Скопируйте токен** (он показывается только один раз!)
8. Используйте этот токен как пароль при `git push`

## Основные команды Git

### Просмотр статуса

```bash
git status
```

### Добавление изменений

```bash
# Добавить все изменения
git add .

# Добавить конкретный файл
git add имя_файла
```

### Создание коммита

```bash
git commit -m "Описание изменений"
```

### Выгрузка изменений на GitHub

```bash
git push
```

### Получение изменений с GitHub

```bash
git pull
```

### Просмотр истории коммитов

```bash
git log
```

## Работа с ветками

### Создание новой ветки

```bash
git checkout -b develop
```

### Переключение на ветку

```bash
git checkout main
git checkout develop
```

### Выгрузка ветки на GitHub

```bash
git push -u origin develop
```

### Слияние веток

```bash
git checkout main
git merge develop
```

## CI/CD Pipeline

Проект уже содержит настройку CI/CD через GitHub Actions (файл `.github/workflows/ci-cd.yml`).

### Что делает CI/CD pipeline:

1. **Тестирование** - запускает тесты при каждом push
2. **Сборка** - собирает Docker образ
3. **Безопасность** - проверяет код на уязвимости
4. **Деплой** - автоматически развертывает на staging (опционально)

### Как это работает:

1. При каждом push в ветку `main` или `develop` автоматически запускается pipeline
2. GitHub Actions выполняет все шаги из `.github/workflows/ci-cd.yml`
3. Результаты можно посмотреть на вкладке **"Actions"** в вашем репозитории

### Просмотр результатов CI/CD:

1. Откройте свой репозиторий на GitHub
2. Перейдите на вкладку **"Actions"**
3. Выберите нужный workflow run
4. Просмотрите логи каждого шага

## Структура проекта в GitHub

После выгрузки структура будет следующей:

```
NIASPO_KR/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # CI/CD pipeline
├── payment-api/               # Основное приложение
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── nginx/                     # Конфигурация Nginx
├── prometheus/                # Конфигурация Prometheus
├── grafana/                   # Конфигурация Grafana
├── docker-compose.yml         # Docker Compose конфигурация
├── docker-swarm.yml           # Docker Swarm конфигурация
├── README.md                  # Основная документация
├── DEPLOYMENT.md              # Руководство по развертыванию
├── NETWORK.md                 # Документация по сети
├── GITHUB_GUIDE.md            # Это руководство
└── .gitignore                 # Игнорируемые файлы
```

## Полезные советы

### 1. Регулярные коммиты

Делайте коммиты часто с понятными сообщениями:

```bash
git add .
git commit -m "Добавлена конфигурация Nginx для балансировки нагрузки"
git push
```

### 2. Игнорирование файлов

Убедитесь, что файл `.gitignore` содержит все необходимые исключения:
- `node_modules/`
- `.env` файлы с паролями
- Логи
- Временные файлы

### 3. Описание коммитов

Используйте понятные сообщения:
- ✅ Хорошо: "Добавлена поддержка репликации PostgreSQL"
- ❌ Плохо: "изменения"

### 4. Работа с Issues

Используйте Issues для отслеживания задач и багов.

### 5. Releases

Создавайте Releases для важных версий проекта:
1. Перейдите в **Releases** → **Create a new release**
2. Укажите версию (например, v1.0.0)
3. Добавьте описание изменений
4. Нажмите **Publish release**

## Решение проблем

### Ошибка: "Permission denied"

**Решение**: Проверьте авторизацию. Используйте Personal Access Token вместо пароля.

### Ошибка: "Remote origin already exists"

**Решение**: Удалите существующий remote и добавьте заново:
```bash
git remote remove origin
git remote add origin https://github.com/ваш-username/NIASPO_KR.git
```

### Ошибка: "Updates were rejected"

**Решение**: Получите последние изменения с GitHub:
```bash
git pull origin main --rebase
git push
```

### Ошибка: "Large files"

**Решение**: Не коммитьте большие файлы. Добавьте их в `.gitignore` и используйте Git LFS для больших файлов, если необходимо.

## Дополнительные ресурсы

- [Документация Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Контакты для помощи

Если возникли проблемы:
1. Проверьте документацию выше
2. Используйте Google для поиска решения
3. Спросите преподавателя или однокурсников

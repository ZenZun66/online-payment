# Использование официального образа Node.js
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей (используем npm install, так как package-lock.json не обязателен)
RUN npm install --omit=dev

# Копирование исходного кода приложения
COPY . .

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Изменение владельца файлов
RUN chown -R nodejs:nodejs /app

# Переключение на непривилегированного пользователя
USER nodejs

# Открытие порта
EXPOSE 3000

# Установка переменных окружения по умолчанию
ENV NODE_ENV=production

# Запуск приложения
CMD ["node", "src/server.js"]

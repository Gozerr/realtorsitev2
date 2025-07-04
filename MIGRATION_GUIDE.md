# Миграция в PostgreSQL

## Шаги для миграции из SQLite в PostgreSQL

### 1. Запуск PostgreSQL в Docker

```bash
# Запустите PostgreSQL и pgAdmin
docker-compose up -d postgres pgadmin
```

### 2. Установка зависимостей

```bash
cd backend
npm install
```

### 3. Создание .env файла

Создайте файл `backend/.env` со следующим содержимым:

```env
# Database Configuration
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=realtorsite_user
DATABASE_PASSWORD=realtorsite_password
DATABASE_NAME=realtorsite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# CORS Configuration
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Environment
NODE_ENV=development
```

### 4. Миграция данных

```bash
# Запустите скрипт миграции
npx ts-node scripts/migrate-to-postgres.ts
```

### 5. Запуск backend с PostgreSQL

```bash
npm run start:dev
```

### 6. Проверка через pgAdmin

Откройте http://localhost:8080 в браузере:
- Email: admin@realtorsite.com
- Password: admin123

## Возврат к SQLite

Если нужно вернуться к SQLite, измените в .env:
```env
DATABASE_TYPE=sqlite
```

## Полезные команды

```bash
# Остановить PostgreSQL
docker-compose down

# Посмотреть логи PostgreSQL
docker-compose logs postgres

# Подключиться к PostgreSQL напрямую
docker exec -it realtorsite_postgres psql -U realtorsite_user -d realtorsite
``` 
# 🏠 RealtorSite - Система управления недвижимостью

Современная веб-платформа для риелторских агентств с полным функционалом управления объектами недвижимости, клиентами и агентами.

## 🚀 Готовность к продакшену: 95%

### ✅ Что готово:
- 🔒 **Безопасность**: Все секреты вынесены в переменные окружения
- 🐳 **Docker**: Полная контейнеризация для разработки и продакшена
- 🔄 **CI/CD**: GitHub Actions для автоматической проверки и деплоя
- 📱 **Frontend**: React с TypeScript, готов к деплою на статический хостинг
- 🔧 **Backend**: NestJS API с PostgreSQL, готов к деплою на VPS
- 🛡️ **HTTPS**: Конфигурация nginx с SSL
- 📊 **Мониторинг**: Health checks и логирование
- 🔄 **Бэкапы**: Автоматические резервные копии БД

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • Netlify       │    │ • VPS           │    │ • Docker        │
│ • Vercel        │    │ • DigitalOcean  │    │ • Redis Cache   │
│ • GitHub Pages  │    │ • Linode        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Быстрый старт

### Локальная разработка (рекомендовано)

1. Запустите Postgres, Redis и PgAdmin через Docker:

```sh
docker-compose -f docker-compose.simple.yml up -d
```

2. Скопируйте `backend/env.example` в `backend/.env` и при необходимости скорректируйте параметры (оставьте DATABASE_HOST=localhost, REDIS_HOST=localhost).

3. Запустите backend локально:

```sh
cd backend
npm install
npm run start:dev
```

4. Запустите frontend локально:

```sh
cd frontend
npm install
npm start
```

5. PgAdmin будет доступен на http://localhost:8080 (email: admin@realtorsite.com, пароль: admin123)

6. API backend будет на http://localhost:3001, фронт — на http://localhost:3000

**Важно:**
- Все переменные окружения для backend описаны в `backend/env.example`.
- Для продакшена используйте полный docker-compose.prod.yml.

### Деплой в продакшен

1. **Frontend** (статический хостинг):
   ```bash
   cd frontend
   npm run build
   # Загрузите папку build на Netlify/Vercel
   ```

2. **Backend** (VPS):
   ```bash
   chmod +x scripts/deploy-backend.sh
   ./scripts/deploy-backend.sh
   ```

📖 **Подробное руководство**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🛠️ Технологии

### Frontend
- **React 18** с TypeScript
- **Ant Design** для UI компонентов
- **React Router** для навигации
- **Axios** для API запросов
- **Socket.io** для real-time чата
- **Leaflet** для карт

### Backend
- **NestJS** с TypeScript
- **PostgreSQL** как основная БД
- **Redis** для кэширования
- **JWT** для аутентификации
- **Socket.io** для WebSocket
- **TypeORM** для работы с БД

### DevOps
- **Docker** и **Docker Compose**
- **Nginx** как reverse proxy
- **Let's Encrypt** для SSL
- **GitHub Actions** для CI/CD

## 📋 Функциональность

### 👥 Управление пользователями
- Регистрация и аутентификация
- Роли: агент, директор
- Профили с аватарами
- Настройки уведомлений

### 🏠 Управление недвижимостью
- CRUD операции с объектами
- Поиск и фильтрация
- Загрузка фотографий
- Статусы объектов (продается, продано, резерв)

### 👤 Управление клиентами
- База клиентов
- Статусы сделок
- История взаимодействий
- Назначение агентов

### 💬 Коммуникация
- Real-time чат между агентами
- Уведомления в реальном времени
- Интеграция с Telegram

### 📅 Календарь
- Личные и публичные события
- Напоминания
- Синхронизация с Telegram

### 📚 Обучение
- База знаний
- Образовательные материалы
- Отслеживание прогресса

## 🔒 Безопасность

- ✅ JWT аутентификация
- ✅ bcrypt хеширование паролей
- ✅ CORS настройки
- ✅ Rate limiting
- ✅ Валидация данных
- ✅ Helmet security headers
- ✅ HTTPS/SSL

## 📊 Мониторинг

- ✅ Health check endpoints
- ✅ Структурированное логирование
- ✅ Docker health checks
- ✅ Nginx access logs
- ✅ Database monitoring

## 🔄 CI/CD

- ✅ Автоматические тесты
- ✅ Линтинг кода
- ✅ Сборка Docker образов
- ✅ Деплой на сервер (опционально)

## 📁 Структура проекта

```
realtorsite/
├── frontend/                 # React приложение
│   ├── src/
│   ├── public/
│   ├── Dockerfile.prod      # Продакшен сборка
│   └── nginx.conf           # Nginx для frontend
├── backend/                  # NestJS API
│   ├── src/
│   ├── Dockerfile.prod      # Продакшен сборка
│   └── healthcheck.js       # Health check
├── scripts/                  # Скрипты деплоя
│   ├── deploy-frontend.sh
│   ├── deploy-backend.sh
│   └── generate-secrets.js
├── docker-compose.yml        # Разработка
├── docker-compose.prod.yml   # Продакшен (всё)
├── docker-compose.backend-only.yml # Только backend
├── nginx.conf               # Nginx для API
├── nginx.api.conf           # Nginx только для API
├── .github/workflows/       # CI/CD
└── docs/                    # Документация
```

## 🚀 Деплой

### Варианты развертывания:

1. **Разделенный деплой** (рекомендуется):
   - Frontend → Netlify/Vercel (бесплатно)
   - Backend → VPS ($5-10/месяц)

2. **Единый сервер**:
   - Всё на одном VPS с Docker

3. **Облачные платформы**:
   - AWS, Google Cloud, Azure

📖 **Подробное руководство**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🧪 Тестирование

```bash
# Backend тесты
cd backend
npm run test

# Frontend тесты
cd frontend
npm run test

# E2E тесты
npm run test:e2e
```

## 📈 Производительность

- ✅ Оптимизированные Docker образы
- ✅ Gzip сжатие
- ✅ Кэширование статических файлов
- ✅ Database indexing
- ✅ Redis кэширование

## 🔧 Разработка

### Добавление новых функций

1. Создайте feature branch
2. Разработайте функциональность
3. Напишите тесты
4. Создайте Pull Request
5. CI/CD автоматически проверит код

### Структура кода

- **Backend**: Модульная архитектура NestJS
- **Frontend**: Компонентный подход React
- **Database**: Миграции TypeORM
- **API**: RESTful endpoints

## 📞 Поддержка

- 📖 [Документация по деплою](./DEPLOYMENT_GUIDE.md)
- 🔒 [Чек-лист безопасности](./SECURITY_CHECKLIST.md)
- 🚀 [Руководство по продакшену](./PRODUCTION_DEPLOYMENT.md)
- 🐛 [Issues](https://github.com/yourusername/realtorsite/issues)

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

---

**🎉 Проект готов к использованию в продакшене!**

При возникновении вопросов обращайтесь к документации или создавайте issues в репозитории. 
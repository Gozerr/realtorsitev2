# 🗄️ Настройка pgAdmin

## 📍 Доступ к pgAdmin

pgAdmin доступен по адресу: **http://localhost:8080**

## 🔐 Данные для входа

- **Email:** `admin@realtorsite.com`
- **Password:** `admin123`

## 🔗 Подключение к базе данных

После входа в pgAdmin выполните следующие шаги:

### 1. Добавить новый сервер
1. Правый клик на "Servers" → "Register" → "Server..."

### 2. Настройки подключения
**General tab:**
- **Name:** `Real Estate Database`

**Connection tab:**
- **Host name/address:** `postgres`
- **Port:** `5432`
- **Maintenance database:** `realtorsite`
- **Username:** `postgres`
- **Password:** (значение из переменной `DATABASE_PASSWORD` в .env)

### 3. Сохранить подключение
Нажмите "Save" для сохранения настроек.

## 🛠️ Альтернативный способ (автоматическая настройка)

Если автоматическая настройка не сработала, выполните в контейнере pgAdmin:

```bash
# Подключиться к контейнеру
docker exec -it realtorsite_pgadmin bash

# Запустить скрипт настройки
chmod +x /init-pgadmin.sh
/init-pgadmin.sh
```

## 🔍 Проверка подключения

После подключения вы должны увидеть:
- База данных `realtorsite`
- Таблицы: `users`, `properties`, `clients`, `calendar_events`, etc.

## 🚨 Возможные проблемы

### 1. Ошибка подключения
- Убедитесь, что PostgreSQL контейнер запущен
- Проверьте правильность пароля из .env файла

### 2. pgAdmin не загружается
- Проверьте логи: `docker logs realtorsite_pgadmin`
- Перезапустите контейнер: `docker-compose restart pgadmin`

### 3. Не видно базы данных
- Убедитесь, что база данных создана
- Проверьте права доступа пользователя

## 📊 Полезные команды

```bash
# Проверить статус контейнеров
docker-compose ps

# Посмотреть логи pgAdmin
docker logs realtorsite_pgadmin

# Перезапустить pgAdmin
docker-compose restart pgadmin

# Полная пересборка
docker-compose down
docker-compose up -d
``` 
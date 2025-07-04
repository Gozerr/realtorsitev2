#!/bin/bash

# Скрипт для деплоя backend на VPS

set -e

echo "🚀 Начинаем деплой backend на VPS..."

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    echo "❌ Ошибка: файл .env не найден"
    echo "Создайте .env файл на основе env.example"
    exit 1
fi

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Ошибка: Docker не установлен"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Ошибка: Docker Compose не установлен"
    exit 1
fi

# Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.backend-only.yml down || true

# Создаем необходимые директории
echo "📁 Создаем директории..."
mkdir -p logs/nginx
mkdir -p backups
mkdir -p ssl

# Проверяем SSL сертификаты
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️  SSL сертификаты не найдены"
    echo "Создайте самоподписанные сертификаты для тестирования:"
    echo "openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem"
    echo ""
    echo "Или получите бесплатные сертификаты Let's Encrypt:"
    echo "sudo certbot certonly --standalone -d yourdomain.com"
    echo "sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem"
    echo "sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem"
    echo ""
    read -p "Продолжить без SSL? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Собираем и запускаем контейнеры
echo "🔨 Собираем и запускаем контейнеры..."
docker-compose -f docker-compose.backend-only.yml up -d --build

# Ждем запуска сервисов
echo "⏳ Ждем запуска сервисов..."
sleep 10

# Проверяем статус
echo "📊 Проверяем статус сервисов..."
docker-compose -f docker-compose.backend-only.yml ps

# Проверяем health endpoints
echo "🏥 Проверяем health endpoints..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx health check: OK"
else
    echo "❌ Nginx health check: FAILED"
fi

if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check: OK"
else
    echo "❌ Backend health check: FAILED"
fi

echo ""
echo "🎉 Backend успешно развернут!"
echo ""
echo "📋 Информация:"
echo "- API доступен по адресу: http://localhost/api"
echo "- Health check: http://localhost/health"
echo "- Логи nginx: logs/nginx/"
echo "- Бэкапы БД: backups/"
echo ""
echo "🔧 Полезные команды:"
echo "- Просмотр логов: docker-compose -f docker-compose.backend-only.yml logs -f"
echo "- Остановка: docker-compose -f docker-compose.backend-only.yml down"
echo "- Перезапуск: docker-compose -f docker-compose.backend-only.yml restart"
echo ""
echo "🔒 Не забудьте:"
echo "1. Настроить firewall (порты 80, 443, 22)"
echo "2. Настроить SSL сертификаты"
echo "3. Настроить автоматические бэкапы"
echo "4. Настроить мониторинг" 
@echo off
REM Скрипт для деплоя backend на VPS (Windows)

echo 🚀 Начинаем деплой backend на VPS...

REM Проверяем наличие .env файла
if not exist ".env" (
    echo ❌ Ошибка: файл .env не найден
    echo Создайте .env файл на основе env.example
    pause
    exit /b 1
)

REM Проверяем наличие Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Ошибка: Docker не установлен
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Ошибка: Docker Compose не установлен
    pause
    exit /b 1
)

REM Останавливаем старые контейнеры
echo 🛑 Останавливаем старые контейнеры...
docker-compose -f docker-compose.backend-only.yml down

REM Создаем необходимые директории
echo 📁 Создаем директории...
if not exist "logs\nginx" mkdir logs\nginx
if not exist "backups" mkdir backups
if not exist "ssl" mkdir ssl

REM Проверяем SSL сертификаты
if not exist "ssl\cert.pem" (
    echo ⚠️  SSL сертификаты не найдены
    echo Создайте самоподписанные сертификаты для тестирования:
    echo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem
    echo.
    echo Или получите бесплатные сертификаты Let's Encrypt:
    echo sudo certbot certonly --standalone -d yourdomain.com
    echo sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
    echo sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
    echo.
    set /p continue="Продолжить без SSL? (y/n): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
)

REM Собираем и запускаем контейнеры
echo 🔨 Собираем и запускаем контейнеры...
docker-compose -f docker-compose.backend-only.yml up -d --build

REM Ждем запуска сервисов
echo ⏳ Ждем запуска сервисов...
timeout /t 10 /nobreak >nul

REM Проверяем статус
echo 📊 Проверяем статус сервисов...
docker-compose -f docker-compose.backend-only.yml ps

REM Проверяем health endpoints
echo 🏥 Проверяем health endpoints...
curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Nginx health check: FAILED
) else (
    echo ✅ Nginx health check: OK
)

curl -f http://localhost/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend health check: FAILED
) else (
    echo ✅ Backend health check: OK
)

echo.
echo 🎉 Backend успешно развернут!
echo.
echo 📋 Информация:
echo - API доступен по адресу: http://localhost/api
echo - Health check: http://localhost/health
echo - Логи nginx: logs/nginx/
echo - Бэкапы БД: backups/
echo.
echo 🔧 Полезные команды:
echo - Просмотр логов: docker-compose -f docker-compose.backend-only.yml logs -f
echo - Остановка: docker-compose -f docker-compose.backend-only.yml down
echo - Перезапуск: docker-compose -f docker-compose.backend-only.yml restart
echo.
echo 🔒 Не забудьте:
echo 1. Настроить firewall (порты 80, 443, 22)
echo 2. Настроить SSL сертификаты
echo 3. Настроить автоматические бэкапы
echo 4. Настроить мониторинг

pause 
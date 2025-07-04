@echo off
REM Скрипт для деплоя frontend на статический хостинг (Windows)

echo 🚀 Начинаем деплой frontend...

REM Проверяем, что мы в корне проекта
if not exist "frontend\package.json" (
    echo ❌ Ошибка: скрипт должен запускаться из корня проекта
    exit /b 1
)

REM Переходим в папку frontend
cd frontend

REM Устанавливаем зависимости
echo 📦 Устанавливаем зависимости...
call npm ci

REM Собираем проект
echo 🔨 Собираем проект...
call npm run build

REM Проверяем, что сборка прошла успешно
if not exist "build" (
    echo ❌ Ошибка: папка build не создана
    exit /b 1
)

echo ✅ Сборка завершена успешно!

REM Копируем env.production в build если существует
if exist "env.production" (
    echo 📝 Копируем переменные окружения...
    copy env.production build\.env
)

echo 🎉 Frontend готов к деплою!
echo.
echo 📋 Следующие шаги:
echo 1. Загрузите содержимое папки 'build' на ваш статический хостинг
echo 2. Настройте переменную окружения REACT_APP_API_URL на вашем API домене
echo 3. Настройте SPA routing (все запросы должны вести на index.html)
echo.
echo 🌐 Популярные хостинги:
echo - Netlify: https://netlify.com
echo - Vercel: https://vercel.com
echo - GitHub Pages: https://pages.github.com
echo - Firebase Hosting: https://firebase.google.com/docs/hosting

pause 
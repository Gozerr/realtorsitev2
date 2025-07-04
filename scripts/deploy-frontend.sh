#!/bin/bash

# Скрипт для деплоя frontend на статический хостинг (Netlify/Vercel)

set -e

echo "🚀 Начинаем деплой frontend..."

# Проверяем, что мы в корне проекта
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Ошибка: скрипт должен запускаться из корня проекта"
    exit 1
fi

# Переходим в папку frontend
cd frontend

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm ci

# Собираем проект
echo "🔨 Собираем проект..."
npm run build

# Проверяем, что сборка прошла успешно
if [ ! -d "build" ]; then
    echo "❌ Ошибка: папка build не создана"
    exit 1
fi

echo "✅ Сборка завершена успешно!"

# Копируем .env.production в build если существует
if [ -f "env.production" ]; then
    echo "📝 Копируем переменные окружения..."
    cp env.production build/.env
fi

echo "🎉 Frontend готов к деплою!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите содержимое папки 'build' на ваш статический хостинг"
echo "2. Настройте переменную окружения REACT_APP_API_URL на вашем API домене"
echo "3. Настройте SPA routing (все запросы должны вести на index.html)"
echo ""
echo "🌐 Популярные хостинги:"
echo "- Netlify: https://netlify.com"
echo "- Vercel: https://vercel.com"
echo "- GitHub Pages: https://pages.github.com"
echo "- Firebase Hosting: https://firebase.google.com/docs/hosting" 
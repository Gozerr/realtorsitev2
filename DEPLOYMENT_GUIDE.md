# 🚀 Руководство по деплою проекта

## 📋 Обзор архитектуры

Проект подготовлен для разделенного деплоя:
- **Frontend** → Статический хостинг (Netlify, Vercel, GitHub Pages)
- **Backend** → VPS/облако (DigitalOcean, Linode, AWS, etc.)

## 🎯 Преимущества такого подхода

- ✅ **Быстрая загрузка** frontend через CDN
- ✅ **Масштабируемость** backend независимо
- ✅ **Безопасность** - API изолирован
- ✅ **Стоимость** - frontend бесплатно, backend дешево
- ✅ **Простота** - каждый компонент на своем месте

---

## 🌐 Деплой Frontend (Статический хостинг)

### Вариант 1: Netlify (Рекомендуется)

1. **Подготовка:**
   ```bash
   # Собрать frontend
   cd frontend
   npm run build
   ```

2. **Деплой:**
   - Зарегистрируйтесь на [netlify.com](https://netlify.com)
   - Перетащите папку `frontend/build` в Netlify
   - Или подключите GitHub репозиторий

3. **Настройка переменных окружения:**
   - В Netlify Dashboard → Site settings → Environment variables
   - Добавьте: `REACT_APP_API_URL=https://api.yourdomain.com`

4. **Настройка SPA routing:**
   - Создайте файл `frontend/public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Вариант 2: Vercel

1. **Установите Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Деплой:**
   ```bash
   cd frontend
   vercel
   ```

3. **Настройка переменных:**
   - В Vercel Dashboard → Project Settings → Environment Variables
   - Добавьте: `REACT_APP_API_URL=https://api.yourdomain.com`

### Вариант 3: GitHub Pages

1. **Настройте GitHub Actions** (уже готово в `.github/workflows/ci.yml`)
2. **Включите GitHub Pages** в настройках репозитория
3. **Настройте переменные окружения**

---

## 🖥️ Деплой Backend (VPS)

### Шаг 1: Выбор VPS

**Рекомендуемые провайдеры:**
- **DigitalOcean** - $5-10/месяц, простой интерфейс
- **Linode** - $5-10/месяц, хорошая производительность
- **Vultr** - $2.50-10/месяц, много локаций
- **AWS Lightsail** - $3.50-10/месяц, интеграция с AWS

### Шаг 2: Подготовка сервера

```bash
# Подключитесь к серверу
ssh root@your-server-ip

# Обновите систему
apt update && apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Создайте пользователя для приложения
adduser appuser
usermod -aG docker appuser
```

### Шаг 3: Настройка домена

1. **Купите домен** (например, на reg.ru, namecheap.com)
2. **Настройте DNS:**
   - `A` запись: `api.yourdomain.com` → IP вашего сервера
   - `A` запись: `yourdomain.com` → IP вашего сервера (или CNAME на frontend)

### Шаг 4: SSL сертификаты

```bash
# Установите Certbot
apt install certbot

# Получите сертификаты
certbot certonly --standalone -d api.yourdomain.com

# Скопируйте сертификаты
mkdir -p /home/appuser/ssl
cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /home/appuser/ssl/cert.pem
cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /home/appuser/ssl/key.pem
chown -R appuser:appuser /home/appuser/ssl
```

### Шаг 5: Деплой приложения

```bash
# Переключитесь на пользователя приложения
su - appuser

# Склонируйте репозиторий
git clone https://github.com/yourusername/realtorsite.git
cd realtorsite

# Создайте .env файл
cp backend/env.example .env
# Отредактируйте .env с реальными значениями

# Запустите деплой
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh
```

---

## 🔧 Настройка после деплоя

### 1. Firewall

```bash
# Настройте UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Автоматические бэкапы

```bash
# Создайте скрипт бэкапа
cat > /home/appuser/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec realtorsite_postgres_prod pg_dump -U $DATABASE_USERNAME $DATABASE_NAME > /home/appuser/backups/backup_$DATE.sql
# Удалите старые бэкапы (оставьте последние 7)
find /home/appuser/backups -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /home/appuser/backup.sh

# Добавьте в cron (ежедневно в 2:00)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/appuser/backup.sh") | crontab -
```

### 3. Мониторинг

```bash
# Установите htop для мониторинга ресурсов
apt install htop

# Проверяйте логи регулярно
docker-compose -f docker-compose.backend-only.yml logs -f
```

### 4. Обновление SSL сертификатов

```bash
# Добавьте в cron для автоматического обновления
(crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet && docker-compose -f /home/appuser/realtorsite/docker-compose.backend-only.yml restart nginx") | crontab -
```

---

## 🔄 CI/CD (Автоматический деплой)

### GitHub Actions для автодеплоя

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /home/appuser/realtorsite
            git pull origin main
            ./scripts/deploy-backend.sh
```

### Настройка секретов в GitHub

В настройках репозитория → Secrets and variables → Actions добавьте:
- `HOST` - IP вашего сервера
- `USERNAME` - имя пользователя на сервере
- `KEY` - приватный SSH ключ

---

## 🧪 Тестирование

### Проверка работоспособности

```bash
# Проверьте health endpoints
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/health

# Проверьте API
curl https://api.yourdomain.com/api/properties

# Проверьте frontend
curl https://yourdomain.com
```

### Нагрузочное тестирование

```bash
# Установите Apache Bench
apt install apache2-utils

# Протестируйте API
ab -n 1000 -c 10 https://api.yourdomain.com/api/health
```

---

## 🚨 Troubleshooting

### Проблемы с подключением

```bash
# Проверьте статус сервисов
docker-compose -f docker-compose.backend-only.yml ps

# Проверьте логи
docker-compose -f docker-compose.backend-only.yml logs -f backend
docker-compose -f docker-compose.backend-only.yml logs -f nginx

# Проверьте порты
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### Проблемы с SSL

```bash
# Проверьте сертификаты
openssl x509 -in ssl/cert.pem -text -noout

# Проверьте nginx конфигурацию
docker exec realtorsite_nginx_prod nginx -t
```

### Проблемы с базой данных

```bash
# Проверьте подключение к БД
docker exec realtorsite_postgres_prod pg_isready

# Проверьте логи БД
docker-compose -f docker-compose.backend-only.yml logs postgres
```

---

## 📊 Мониторинг и алерты

### Рекомендуемые инструменты

1. **Uptime Robot** - бесплатный мониторинг доступности
2. **Sentry** - мониторинг ошибок
3. **Prometheus + Grafana** - метрики и дашборды
4. **Logwatch** - анализ логов

### Настройка алертов

```bash
# Установите mailutils для отправки уведомлений
apt install mailutils

# Настройте отправку email при проблемах
echo "Subject: Server Alert" | sendmail your-email@example.com
```

---

## 💰 Оценка стоимости

### Минимальная конфигурация:
- **VPS**: $5-10/месяц (DigitalOcean, Linode)
- **Домен**: $10-15/год
- **Frontend хостинг**: Бесплатно (Netlify/Vercel)
- **SSL**: Бесплатно (Let's Encrypt)

**Итого: ~$70-135/год**

---

## 🎉 Готово!

После выполнения всех шагов у вас будет:
- ✅ Быстрый frontend на CDN
- ✅ Безопасный backend API
- ✅ SSL сертификаты
- ✅ Автоматические бэкапы
- ✅ Мониторинг
- ✅ CI/CD для обновлений

**Проект готов к использованию в продакшене!** 
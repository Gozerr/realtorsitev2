# 🚀 Руководство по развертыванию в продакшене

## 📋 Предварительные требования

- Docker и Docker Compose установлены
- SSL сертификаты (Let's Encrypt или коммерческие)
- Домен настроен и указывает на сервер
- Firewall настроен (порты 80, 443, 22)

## 🔧 Пошаговое развертывание

### 1. Подготовка сервера

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка SSL сертификатов

```bash
# Создать директорию для сертификатов
mkdir -p ssl

# Для Let's Encrypt (автоматически)
sudo certbot certonly --standalone -d yourdomain.com

# Скопировать сертификаты
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*
```

### 3. Генерация секретов

```bash
# Сгенерировать безопасные секреты
node scripts/generate-secrets.js

# Создать .env файл
cp backend/env.example .env
# Отредактировать .env с реальными значениями
```

### 4. Настройка базы данных

```bash
# Создать бэкап директорию
mkdir -p backups

# Настроить автоматические бэкапы (cron)
echo "0 2 * * * docker exec realtorsite_postgres_prod pg_dump -U $DATABASE_USERNAME $DATABASE_NAME > backups/backup_\$(date +\%Y\%m\%d_\%H\%M\%S).sql" | crontab -
```

### 5. Развертывание

```bash
# Остановить dev окружение
docker-compose down

# Запустить продакшен
docker-compose -f docker-compose.prod.yml up -d

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Настройка мониторинга

```bash
# Установить Prometheus (опционально)
# Установить Grafana (опционально)
# Настроить алерты
```

## 🔒 Безопасность

### Firewall настройки

```bash
# UFW настройки
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Регулярные обновления

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Мониторинг

### Health Checks

```bash
# Проверить health endpoint
curl https://yourdomain.com/health

# Проверить API
curl https://yourdomain.com/api/health
```

### Логи

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## 🔄 Обновления

### Обновление приложения

```bash
# Остановить сервисы
docker-compose -f docker-compose.prod.yml down

# Обновить код
git pull origin main

# Пересобрать образы
docker-compose -f docker-compose.prod.yml build

# Запустить снова
docker-compose -f docker-compose.prod.yml up -d

# Проверить статус
docker-compose -f docker-compose.prod.yml ps
```

### Обновление SSL сертификатов

```bash
# Обновить Let's Encrypt сертификаты
sudo certbot renew

# Перезапустить nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🚨 Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверить статус БД
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Проверить логи БД
docker-compose -f docker-compose.prod.yml logs postgres
```

### Проблемы с SSL

```bash
# Проверить SSL сертификаты
openssl x509 -in ssl/cert.pem -text -noout

# Проверить nginx конфигурацию
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

## 📈 Масштабирование

### Горизонтальное масштабирование

```bash
# Увеличить количество backend инстансов
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Вертикальное масштабирование

```bash
# Увеличить лимиты ресурсов в docker-compose.prod.yml
# Добавить:
# deploy:
#   resources:
#     limits:
#       memory: 2G
#       cpus: '1.0'
```

## 🔄 Backup и восстановление

### Создание бэкапа

```bash
# Бэкап БД
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $DATABASE_USERNAME $DATABASE_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Бэкап файлов
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### Восстановление

```bash
# Восстановить БД
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DATABASE_USERNAME $DATABASE_NAME < backup_file.sql

# Восстановить файлы
tar -xzf uploads_backup_file.tar.gz
```

## 📞 Поддержка

При возникновении проблем:

1. Проверить логи: `docker-compose -f docker-compose.prod.yml logs`
2. Проверить статус сервисов: `docker-compose -f docker-compose.prod.yml ps`
3. Проверить ресурсы: `docker stats`
4. Проверить сеть: `docker network ls` 
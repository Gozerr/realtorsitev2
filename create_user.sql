-- Показать все таблицы
\dt

-- Создать пользователя для авторизации (если таблица users существует)
-- INSERT INTO users (username, password, email, created_at) 
-- VALUES ('admin', 'qwerty123', 'admin@example.com', NOW());

-- Или если нужно создать пользователя в PostgreSQL
-- CREATE USER frontend_user WITH PASSWORD 'qwerty123'; 
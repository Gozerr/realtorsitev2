-- Проверить данные пользователя admin@example.com
SELECT id, email, password, "firstName", "lastName", role 
FROM "user" 
WHERE email = 'admin@example.com'; 
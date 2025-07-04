-- Создать пользователя для авторизации на фронтенде
INSERT INTO "user" (email, password, "firstName", "lastName", role) 
VALUES ('admin@example.com', 'qwerty123', 'Admin', 'User', 'director');

-- Проверить, что пользователь создался
SELECT id, email, "firstName", "lastName", role FROM "user"; 
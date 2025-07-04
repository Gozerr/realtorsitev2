-- Создать пользователя с зашифрованным паролем qwerty123
-- Пароль qwerty123 зашифрован с bcrypt (10 раундов)
INSERT INTO "user" (email, password, "firstName", "lastName", role) 
VALUES (
  'admin@example.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Admin', 
  'User', 
  'director'
) ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  role = EXCLUDED.role;

-- Проверить, что пользователь создался
SELECT id, email, "firstName", "lastName", role FROM "user" WHERE email = 'admin@example.com'; 
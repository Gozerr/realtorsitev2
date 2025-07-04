-- Создать пользователя с простым паролем qwerty123 (незашифрованным)
INSERT INTO "user" (email, password, "firstName", "lastName", role) 
VALUES (
  'admin@example.com', 
  'qwerty123', 
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
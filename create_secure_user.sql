-- Создание пользователя с bcrypt паролем
-- Пароль: password123 (зашифрован с bcrypt)

INSERT INTO "user" (email, password, "firstName", "lastName", role, "agencyId", photo) 
VALUES (
    'admin@realtorsite.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'Admin',
    'User',
    'director',
    1,
    'https://olimp.vtcrm.ru/uploads/User_photos/phpXxFFcI.jpeg'
) ON CONFLICT (email) DO NOTHING;

-- Проверка создания
SELECT id, email, "firstName", "lastName", role FROM "user" WHERE email = 'admin@realtorsite.com'; 
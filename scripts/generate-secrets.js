const crypto = require('crypto');

console.log('🔐 Генерация безопасных секретов для продакшена\n');

// Генерация JWT секрета
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Генерация пароля для базы данных
const dbPassword = crypto.randomBytes(32).toString('hex');
console.log('DATABASE_PASSWORD=' + dbPassword);

// Генерация секрета для сессий
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

// Генерация API ключа
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API_KEY=' + apiKey);

console.log('\n📝 Инструкции:');
console.log('1. Скопируйте эти значения в ваш .env файл');
console.log('2. НИКОГДА не коммитьте .env файл в git');
console.log('3. Храните секреты в безопасном месте');
console.log('4. Регулярно обновляйте секреты');

console.log('\n⚠️  ВАЖНО: Замените все хардкод секреты в коде на переменные окружения!'); 
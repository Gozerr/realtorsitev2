const cron = require('node-cron');
const { exec } = require('child_process');

// Каждый день в 3:00 ночи
cron.schedule('0 3 * * *', () => {
  console.log('Запуск парсера expomap.ru:', new Date().toLocaleString());
  exec('node backend/scripts/parseExpomapEvents.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Ошибка при запуске парсера:', error.message);
      return;
    }
    if (stderr) {
      console.error('stderr:', stderr);
    }
    console.log('stdout:', stdout);
  });
});

console.log('Cron-задача для парсера expomap.ru запущена.'); 
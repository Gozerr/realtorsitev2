const cron = require('node-cron');
const { exec } = require('child_process');

// Каждый день в 4:00 ночи
cron.schedule('0 4 * * *', () => {
  console.log('Запуск парсера mirkvartir.ru:', new Date().toLocaleString());
  exec('node backend/scripts/parseMirkvartir.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Ошибка при запуске парсера:', error.message);
      return;
    }
    if (stderr) {
      console.error('stderr:', stderr);
    }
    console.log('stdout:', stdout);
    // После парсинга запускаем импорт
    exec('npx ts-node backend/scripts/importRecentObjects.ts', (error2, stdout2, stderr2) => {
      if (error2) {
        console.error('Ошибка при импорте:', error2.message);
        return;
      }
      if (stderr2) {
        console.error('stderr:', stderr2);
      }
      console.log('stdout:', stdout2);
    });
  });
});

 
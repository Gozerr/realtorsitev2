const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db.sqlite');
const db = new sqlite3.Database(dbPath);

async function run() {
  // 1. Удалить дубли (оставить только одну запись для каждой уникальной комбинации)
  await new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM calendar_events
       WHERE id NOT IN (
         SELECT MIN(id)
         FROM calendar_events
         GROUP BY title, start, end, type
       );`,
      (err) => {
        if (err) return reject(err);
        console.log('✅ Дубли удалены');
        resolve();
      }
    );
  });

  // 2. Создать уникальный индекс (если ещё не создан)
  await new Promise((resolve, reject) => {
    db.run(
      'CREATE UNIQUE INDEX IF NOT EXISTS uniq_event ON calendar_events (title, start, end, type);',
      (err) => {
        if (err) return reject(err);
        console.log('✅ Уникальный индекс создан (или уже был)');
        resolve();
      }
    );
  });

  // 3. Вывести потенциальные дубли для анализа
  await new Promise((resolve, reject) => {
    db.all(
      `SELECT title, start, COUNT(*) as cnt
       FROM calendar_events
       WHERE type='public'
       GROUP BY title, start
       HAVING cnt > 1
       ORDER BY cnt DESC
       LIMIT 30;`,
      (err, rows) => {
        if (err) return reject(err);
        if (rows.length) {
          console.log('Потенциальные дубли (title+start):');
          rows.forEach(r => console.log(r));
        } else {
          console.log('Нет явных дублей по title+start');
        }
        resolve();
      }
    );
  });

  // 4. Вывести подробности по дублям
  await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, start, end, type FROM calendar_events WHERE type='public' ORDER BY title, start, end;`,
      (err, rows) => {
        if (err) return reject(err);
        console.log('Все публичные события (для анализа):');
        rows.forEach(r => console.log(r));
        resolve();
      }
    );
  });

  db.close();
  console.log('🎉 Очистка и анализ завершены!');
}

run().catch(e => {
  console.error('Ошибка:', e);
  db.close();
}); 
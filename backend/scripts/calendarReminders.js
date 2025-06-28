const { AppDataSource } = require('../src/data-source');
const { CalendarEvent } = require('../src/calendar/calendar-event.entity');
const { User } = require('../src/users/user.entity');
const { sendTelegramMessage } = require('../src/telegram.service');
const dayjs = require('dayjs');

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  await AppDataSource.initialize();
  const eventRepo = AppDataSource.getRepository(CalendarEvent);
  const now = dayjs();
  const inOneHour = now.add(1, 'hour').startOf('minute');
  const inFiveMinutes = now.add(5, 'minute').startOf('minute');

  // События через 1 час
  const events1h = await eventRepo.find({
    where: {
      start: inOneHour.toDate(),
      type: 'personal',
    },
    relations: ['user'],
  });
  for (const event of events1h) {
    if (event.user && event.user.telegramId) {
      const msg = `<b>Напоминание!</b><br>Через <b>1 час</b> у вас мероприятие:<br><b>${escapeHtml(event.title)}</b><br>Начало: ${dayjs(event.start).format('DD.MM.YYYY HH:mm')}`;
      await sendTelegramMessage(event.user.telegramId, msg);
    }
  }

  // События через 5 минут
  const events5m = await eventRepo.find({
    where: {
      start: inFiveMinutes.toDate(),
      type: 'personal',
    },
    relations: ['user'],
  });
  for (const event of events5m) {
    if (event.user && event.user.telegramId) {
      const msg = `<b>Внимание!</b><br>Событие <b>${escapeHtml(event.title)}</b> начинается <b>через 5 минут</b>!<br>Проверьте, всё ли готово.`;
      await sendTelegramMessage(event.user.telegramId, msg);
    }
  }
  await AppDataSource.destroy();
}

main().catch(e => {
  console.error('Ошибка в напоминаниях:', e);
  process.exit(1);
}); 
import { DataSource } from 'typeorm';
import { Property } from '../src/properties/property.entity';
import { User } from '../src/users/user.entity';
import { Agency } from '../src/agencies/agency.entity';
import { Client } from '../src/clients/client.entity';
import { Notification } from '../src/notifications/notification.entity';
import { UserNotificationSettings } from '../src/notifications/user-notification-settings.entity';
import { EducationEvent } from '../src/education/education-event.entity';
import { Selection } from '../src/selections/selection.entity';
import { CalendarEvent } from '../src/calendar/calendar-event.entity';

(async () => {
  const ds = new DataSource({
    type: 'sqlite',
    database: 'db.sqlite',
    entities: [
      User,
      Property,
      Agency,
      Client,
      Notification,
      UserNotificationSettings,
      EducationEvent,
      Selection,
      CalendarEvent,
    ],
    synchronize: false,
  });
  await ds.initialize();
  const qr = ds.createQueryRunner();
  // Обновляем все photos, которые не начинаются с '[' (не массив JSON)
  await qr.query(`UPDATE property SET photos = '[]' WHERE photos IS NOT NULL AND substr(photos, 1, 1) != '['`);
  await ds.destroy();
  console.log('Готово! Все photos теперь корректны (JSON-массивы).');
})(); 
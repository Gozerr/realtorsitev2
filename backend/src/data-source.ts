import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Property } from './properties/property.entity';
import { Agency } from './agencies/agency.entity';
import { Client } from './clients/client.entity';
import { Conversation } from './chat/conversation.entity';
import { Message } from './chat/message.entity';
import { Notification } from './notifications/notification.entity';
import { UserNotificationSettings } from './notifications/user-notification-settings.entity';
import { EducationEvent } from './education/education-event.entity';

// Определяем, запущен ли код в development режиме
const isDevelopment = process.env.NODE_ENV !== 'production' || __dirname.includes('src');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: [
    User,
    Property,
    Agency,
    Client,
    Conversation,
    Message,
    Notification,
    UserNotificationSettings,
    EducationEvent
  ],
  migrations: isDevelopment
    ? ['src/migrations/*.ts']
    : ['dist/migrations/*.js'],
  synchronize: false,
}); 
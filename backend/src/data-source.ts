import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Property } from './properties/property.entity';
import { Agency } from './agencies/agency.entity';
import { Client } from './clients/client.entity';
import { Notification } from './notifications/notification.entity';
import { UserNotificationSettings } from './notifications/user-notification-settings.entity';
import { EducationEvent } from './education/education-event.entity';
import { Selection } from './selections/selection.entity';
import { CalendarEvent } from './calendar/calendar-event.entity';
import { RefreshToken } from './users/refresh-token.entity';
import { Chat } from './chat/chat.entity';
import { Message } from './chat/message.entity';

const entities = [
  User,
  Property,
  Agency,
  Client,
  Notification,
  UserNotificationSettings,
  EducationEvent,
  Selection,
  CalendarEvent,
  RefreshToken,
  Chat,
  Message,
];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'realtorsite_user',
  password: 'realtorsite_password_2024',
  database: 'realtorsite',
  entities,
  migrations: ['dist/src/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
}); 
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AgenciesModule } from './agencies/agencies.module';
import { PropertiesModule } from './properties/properties.module';
import { ClientsModule } from './clients/clients.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EducationModule } from './education/education.module';
import { User } from './users/user.entity';
import { Agency } from './agencies/agency.entity';
import { Property } from './properties/property.entity';
import { Client } from './clients/client.entity';
import { Notification } from './notifications/notification.entity';
import { UserNotificationSettings } from './notifications/user-notification-settings.entity';
import { EducationEvent } from './education/education-event.entity';
import { Selection } from './selections/selection.entity';
import { SelectionsModule } from './selections/selections.module';
import { CalendarModule } from './calendar/calendar.module';
import { CalendarEvent } from './calendar/calendar-event.entity';
import { TelegramModule } from './telegram/telegram.module';
import envConfig from '../config/env.config';
import { AppDataSource } from './data-source';
import { UploadController } from './upload.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 минута (в миллисекундах)
        limit: 100, // 100 запросов с одного IP за минуту
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: async () => AppDataSource.options,
    }),
    TelegramModule,
    ChatModule,
    UsersModule,
    AuthModule,
    AgenciesModule,
    PropertiesModule,
    ClientsModule,
    NotificationsModule,
    EducationModule,
    SelectionsModule,
    CalendarModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController, UploadController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AgenciesModule } from './agencies/agencies.module';
import { PropertiesModule } from './properties/properties.module';
import { ClientsModule } from './clients/clients.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EducationModule } from './education/education.module';
import { User } from './users/user.entity';
import { Agency } from './agencies/agency.entity';
import { Property } from './properties/property.entity';
import { Client } from './clients/client.entity';
import { Conversation } from './chat/conversation.entity';
import { Message } from './chat/message.entity';
import { Notification } from './notifications/notification.entity';
import { UserNotificationSettings } from './notifications/user-notification-settings.entity';
import { EducationEvent } from './education/education-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [
        User,
        Agency,
        Property,
        Client,
        Conversation,
        Message,
        Notification,
        UserNotificationSettings,
        EducationEvent,
      ],
      synchronize: false,
    }),
    UsersModule,
    AuthModule,
    AgenciesModule,
    PropertiesModule,
    ClientsModule,
    ChatModule,
    NotificationsModule,
    EducationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

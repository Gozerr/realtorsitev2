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
import { AppDataSource } from './data-source';
import { EducationModule } from './education/education.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => AppDataSource.options,
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

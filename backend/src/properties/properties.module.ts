import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './property.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property, User]), NotificationsModule],
  providers: [PropertiesService],
  controllers: [PropertiesController],
})
export class PropertiesModule {}

import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './property.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';
import { StatisticsModule } from '../statistics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, User]),
    NotificationsModule,
    StatisticsModule,
  ],
  providers: [PropertiesService],
  controllers: [PropertiesController],
  exports: [PropertiesService],
})
export class PropertiesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EducationEvent } from './education-event.entity';
import { EducationService } from './education.service';
import { EducationController } from './education.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([EducationEvent]), NotificationsModule],
  providers: [EducationService],
  controllers: [EducationController],
  exports: [EducationService],
})
export class EducationModule {} 
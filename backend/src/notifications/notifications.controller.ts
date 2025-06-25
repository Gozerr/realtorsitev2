import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationsService.findByUser(Number(userId));
  }

  @Post()
  create(@Body() body: Partial<Notification>): Promise<Notification | Notification[]> {
    return this.notificationsService.create(body);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string): Promise<void> {
    return this.notificationsService.markAsRead(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.notificationsService.remove(Number(id));
  }

  @Get('settings/:userId')
  getUserSettings(@Param('userId') userId: string) {
    return this.notificationsService.getUserSettings(Number(userId));
  }

  @Post('settings/:userId')
  updateUserSettings(@Param('userId') userId: string, @Body() data: any) {
    return this.notificationsService.updateUserSettings(Number(userId), data);
  }
} 
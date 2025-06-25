import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User, UserRole } from '../users/user.entity';
import { UserNotificationSettings } from './user-notification-settings.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserNotificationSettings)
    private readonly settingsRepo: Repository<UserNotificationSettings>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(notification: Partial<Notification>): Promise<Notification | Notification[]> {
    if (notification.userId === 0) {
      // Рассылка всем агентам
      const agents = await this.userRepo.find({ where: { role: UserRole.AGENT } });
      const notifs = agents.map(agent => this.notificationRepo.create({ ...notification, userId: agent.id }));
      const saved = await this.notificationRepo.save(notifs);
      // WebSocket рассылка
      saved.forEach(notif => this.notificationsGateway.sendNotification(notif.userId, notif));
      return saved;
    }
    const entity = this.notificationRepo.create(notification);
    const saved = await this.notificationRepo.save(entity);
    // WebSocket рассылка
    this.notificationsGateway.sendNotification(saved.userId, saved);
    return saved;
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepo.find();
  }

  async findByUser(userId: number, filter?: { category?: string; type?: string }): Promise<Notification[]> {
    const where: any = [
      { userId },
      { userId: 0 },
    ];
    if (filter?.category) {
      where[0].category = filter.category;
      where[1].category = filter.category;
    }
    if (filter?.type) {
      where[0].type = filter.type;
      where[1].type = filter.type;
    }
    return this.notificationRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async createSystem(userId: number, title: string, description?: string): Promise<Notification> {
    return this.create({
      userId,
      type: 'system',
      category: 'system',
      title,
      description,
    }) as Promise<Notification>;
  }

  async markAsRead(id: number): Promise<void> {
    await this.notificationRepo.update(id, { isNew: false });
  }

  async remove(id: number): Promise<void> {
    await this.notificationRepo.delete(id);
  }

  async getUserSettings(userId: number): Promise<UserNotificationSettings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepo.create({ userId });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateUserSettings(userId: number, data: Partial<UserNotificationSettings>): Promise<UserNotificationSettings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepo.create({ userId });
    }
    Object.assign(settings, data);
    return this.settingsRepo.save(settings);
  }
} 
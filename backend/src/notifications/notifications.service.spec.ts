import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { User, UserRole } from '../users/user.entity';
import { UserNotificationSettings } from './user-notification-settings.entity';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: Repository<Notification>;
  let userRepo: Repository<User>;
  let settingsRepo: Repository<UserNotificationSettings>;
  let notificationsGateway: NotificationsGateway;

  const mockNotification = {
    id: 1,
    userId: 1,
    type: 'info',
    category: 'property',
    title: 'Test Notification',
    description: 'Test Description',
    isNew: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserNotificationSettings),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepo = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    settingsRepo = module.get<Repository<UserNotificationSettings>>(getRepositoryToken(UserNotificationSettings));
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const createData = {
        userId: 1,
        title: 'Test Notification',
        description: 'Test Description',
      };

      jest.spyOn(notificationRepo, 'create').mockReturnValue(mockNotification);
      jest.spyOn(notificationRepo, 'save').mockResolvedValue(mockNotification);
      jest.spyOn(notificationsGateway, 'sendNotification').mockImplementation(() => {});

      const result = await service.create(createData);

      expect(result).toEqual(mockNotification);
      expect(notificationRepo.create).toHaveBeenCalledWith(createData);
      expect(notificationRepo.save).toHaveBeenCalledWith(mockNotification);
      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(mockNotification.userId, mockNotification);
    });
  });

  describe('findAll', () => {
    it('should return all notifications', async () => {
      const mockNotifications = [mockNotification];
      jest.spyOn(notificationRepo, 'find').mockResolvedValue(mockNotifications);

      const result = await service.findAll();

      expect(result).toEqual(mockNotifications);
      expect(notificationRepo.find).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return notifications for user', async () => {
      const mockNotifications = [mockNotification];
      jest.spyOn(notificationRepo, 'find').mockResolvedValue(mockNotifications);

      const result = await service.findByUser(1);

      expect(result).toEqual(mockNotifications);
      expect(notificationRepo.find).toHaveBeenCalledWith({
        where: [{ userId: 1 }, { userId: 0 }],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      jest.spyOn(notificationRepo, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.markAsRead(1);

      expect(notificationRepo.update).toHaveBeenCalledWith(1, { isNew: false });
    });
  });

  describe('remove', () => {
    it('should remove notification', async () => {
      jest.spyOn(notificationRepo, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove(1);

      expect(notificationRepo.delete).toHaveBeenCalledWith(1);
    });
  });
}); 
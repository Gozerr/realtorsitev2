import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findByUser: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({}),
            markAsRead: jest.fn().mockResolvedValue(undefined),
            remove: jest.fn().mockResolvedValue(undefined),
            getUserSettings: jest.fn().mockResolvedValue({}),
            updateUserSettings: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all notifications', async () => {
    expect(await controller.findAll()).toEqual([]);
  });

  it('should return notifications by user', async () => {
    expect(await controller.findByUser('1')).toEqual([]);
  });

  it('should create notification', async () => {
    expect(await controller.create({})).toEqual({});
  });

  it('should mark as read', async () => {
    await expect(controller.markAsRead('1')).resolves.toBeUndefined();
  });

  it('should remove notification', async () => {
    await expect(controller.remove('1')).resolves.toBeUndefined();
  });

  it('should get user settings', async () => {
    expect(await controller.getUserSettings('1')).toEqual({});
  });

  it('should update user settings', async () => {
    expect(await controller.updateUserSettings('1', {})).toEqual({});
  });
}); 
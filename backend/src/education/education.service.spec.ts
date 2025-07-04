import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationService } from './education.service';
import { EducationEvent } from './education-event.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('EducationService', () => {
  let service: EducationService;
  let educationRepo: Repository<EducationEvent>;
  let notificationsService: NotificationsService;

  const mockEvent = {
    id: 1,
    title: 'Test Education Event',
    description: 'Test Description',
    date: new Date('2024-01-01T10:00:00Z'),
    type: 'course',
    isActive: true,
    link: 'https://example.com',
    img: 'image.jpg',
    place: 'Online',
    endDate: new Date('2024-01-01T12:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        {
          provide: getRepositoryToken(EducationEvent),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EducationService>(EducationService);
    educationRepo = module.get<Repository<EducationEvent>>(getRepositoryToken(EducationEvent));
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all education events', async () => {
      const mockEvents = [mockEvent];
      jest.spyOn(educationRepo, 'find').mockResolvedValue(mockEvents);

      const result = await service.findAll();

      expect(result).toEqual(mockEvents);
      expect(educationRepo.find).toHaveBeenCalledWith({ order: { date: 'DESC' } });
    });

    it('should return empty array when no events exist', async () => {
      jest.spyOn(educationRepo, 'find').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return education event by id', async () => {
      jest.spyOn(educationRepo, 'findOne').mockResolvedValue(mockEvent);

      const result = await service.findOne(1);

      expect(result).toEqual(mockEvent);
      expect(educationRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when event not found', async () => {
      jest.spyOn(educationRepo, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new education event', async () => {
      const createData = {
        title: 'New Event',
        description: 'New Description',
        date: new Date('2024-01-01T10:00:00Z'),
        type: 'webinar',
      };

      jest.spyOn(educationRepo, 'create').mockReturnValue(mockEvent);
      jest.spyOn(educationRepo, 'save').mockResolvedValue(mockEvent);
      jest.spyOn(notificationsService, 'create').mockResolvedValue({ id: 1, title: '', userId: 1, type: '', category: '', description: '', isNew: false, createdAt: new Date() });

      const result = await service.create(createData);

      expect(result).toEqual(mockEvent);
      expect(educationRepo.create).toHaveBeenCalledWith(createData);
      expect(educationRepo.save).toHaveBeenCalledWith(mockEvent);
      expect(notificationsService.create).toHaveBeenCalledWith({
        userId: 0,
        type: 'education',
        category: 'education',
        title: 'Новое обучающее событие',
        description: expect.stringContaining('Test Education Event'),
      });
    });
  });

  describe('update', () => {
    it('should update existing education event', async () => {
      const updateData = { title: 'Updated Event' };
      const updatedEvent = { ...mockEvent, ...updateData };

      jest.spyOn(educationRepo, 'findOne').mockResolvedValue(mockEvent);
      jest.spyOn(educationRepo, 'save').mockResolvedValue(updatedEvent);
      jest.spyOn(notificationsService, 'create').mockResolvedValue({ id: 1, title: '', userId: 1, type: '', category: '', description: '', isNew: false, createdAt: new Date() });

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedEvent);
      expect(educationRepo.save).toHaveBeenCalledWith(updatedEvent);
      expect(notificationsService.create).toHaveBeenCalledWith({
        userId: 0,
        type: 'education',
        category: 'education',
        title: 'Обновлено обучающее событие',
        description: expect.stringContaining('Updated Event'),
      });
    });

    it('should throw error when event not found', async () => {
      jest.spyOn(educationRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, { title: 'Updated' })).rejects.toThrow('Событие не найдено');
    });
  });

  describe('remove', () => {
    it('should remove education event', async () => {
      jest.spyOn(educationRepo, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove(1);

      expect(educationRepo.delete).toHaveBeenCalledWith(1);
    });
  });
}); 
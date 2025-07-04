import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarService } from './calendar.service';
import { CalendarEvent } from './calendar-event.entity';
import { User, UserRole } from '../users/user.entity';
import { TelegramService } from '../telegram.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let calendarRepository: Repository<CalendarEvent>;
  let telegramService: TelegramService;

  const mockUser = {
    id: 1,
    email: 'user@test.com',
    password: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    photo: '',
    phone: '',
    city: '',
    region: '',
    role: UserRole.AGENT,
    agency: { id: 1, name: 'Test Agency', users: [] },
    properties: [],
    clients: [],
    telegramId: '',
  };

  const mockEvent = {
    id: 1,
    title: 'Test Event',
    description: 'Test Description',
    start: new Date('2024-01-01T10:00:00Z'),
    end: new Date('2024-01-01T11:00:00Z'),
    type: 'personal' as const,
    user: mockUser,
    userId: 1,
    relatedObjectId: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getRepositoryToken(CalendarEvent),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              into: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              execute: jest.fn(),
            })),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: TelegramService,
          useValue: {
            sendTelegramMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    calendarRepository = module.get<Repository<CalendarEvent>>(getRepositoryToken(CalendarEvent));
    telegramService = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return all events for user', async () => {
      const mockEvents = [mockEvent];
      jest.spyOn(calendarRepository, 'find').mockResolvedValue(mockEvents);

      const result = await service.findAllForUser(mockUser);

      expect(result).toEqual(mockEvents);
      expect(calendarRepository.find).toHaveBeenCalledWith({
        where: [
          { user: { id: mockUser.id } },
          { type: 'public' },
        ],
        order: { start: 'ASC' },
      });
    });
  });

  describe('findPersonal', () => {
    it('should return personal events for user', async () => {
      const mockEvents = [mockEvent];
      jest.spyOn(calendarRepository, 'find').mockResolvedValue(mockEvents);

      const result = await service.findPersonal(mockUser);

      expect(result).toEqual(mockEvents);
      expect(calendarRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, type: 'personal' },
        order: { start: 'ASC' },
      });
    });
  });

  describe('findPublic', () => {
    it('should return public events', async () => {
      const mockEvents = [mockEvent];
      jest.spyOn(calendarRepository, 'find').mockResolvedValue(mockEvents);

      const result = await service.findPublic();

      expect(result).toEqual(mockEvents);
      expect(calendarRepository.find).toHaveBeenCalledWith({
        where: { type: 'public' },
        order: { start: 'ASC' },
      });
    });
  });

  describe('findOneById', () => {
    it('should return event by id for user', async () => {
      jest.spyOn(calendarRepository, 'findOne').mockResolvedValue(mockEvent);

      const result = await service.findOneById(1, mockUser);

      expect(result).toEqual(mockEvent);
      expect(calendarRepository.findOne).toHaveBeenCalledWith({
        where: [
          { id: 1, user: { id: mockUser.id } },
          { id: 1, type: 'public' },
        ],
      });
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createData = {
        title: 'New Event',
        description: 'New Description',
        start: new Date('2024-01-01T10:00:00Z'),
        end: new Date('2024-01-01T11:00:00Z'),
        type: 'personal' as const,
      };

      const queryBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
      };
      jest.spyOn(calendarRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(calendarRepository, 'findOne').mockResolvedValueOnce(null).mockResolvedValueOnce(mockEvent);
      jest.spyOn(telegramService, 'sendTelegramMessage').mockResolvedValue(undefined);

      const result = await service.create(createData, mockUser);

      expect(result).toEqual(mockEvent);
      expect(queryBuilder.values).toHaveBeenCalledWith({
        ...createData,
        userId: mockUser.id,
      });
    });
  });

  describe('update', () => {
    it('should update an existing event', async () => {
      const updateData = { title: 'Updated Event' };
      jest.spyOn(calendarRepository, 'findOne').mockResolvedValue(mockEvent);
      jest.spyOn(calendarRepository, 'save').mockResolvedValue({ ...mockEvent, ...updateData });

      const result = await service.update(1, updateData, mockUser);

      expect(result).toEqual({ ...mockEvent, ...updateData });
      expect(calendarRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an event', async () => {
      jest.spyOn(calendarRepository, 'findOne').mockResolvedValue(mockEvent);
      jest.spyOn(calendarRepository, 'remove').mockResolvedValue(mockEvent as any);

      const result = await service.remove(1, mockUser);

      expect(result).toBe(true);
      expect(calendarRepository.remove).toHaveBeenCalledWith(mockEvent);
    });

    it('should return false if event not found', async () => {
      jest.spyOn(calendarRepository, 'findOne').mockResolvedValue(null);

      const result = await service.remove(999, mockUser);

      expect(result).toBe(false);
    });
  });
}); 
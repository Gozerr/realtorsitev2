import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { User, UserRole } from '../users/user.entity';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.AGENT,
  };

  const mockEvent = {
    id: 1,
    title: 'Test Event',
    description: 'Test Description',
    date: new Date(),
    type: 'personal',
    userId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: {
            findAllForUser: jest.fn(),
            findPersonal: jest.fn(),
            findPublic: jest.fn(),
            findOneById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all events for user', async () => {
      const req = { user: mockUser };
      const expectedEvents = [mockEvent];
      jest.spyOn(service, 'findAllForUser').mockResolvedValue(expectedEvents);

      const result = await controller.findAll(req);

      expect(result).toEqual(expectedEvents);
      expect(service.findAllForUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findPersonal', () => {
    it('should return personal events for user', async () => {
      const req = { user: mockUser };
      const expectedEvents = [mockEvent];
      jest.spyOn(service, 'findPersonal').mockResolvedValue(expectedEvents);

      const result = await controller.findPersonal(req);

      expect(result).toEqual(expectedEvents);
      expect(service.findPersonal).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findPublic', () => {
    it('should return public events', async () => {
      const expectedEvents = [mockEvent];
      jest.spyOn(service, 'findPublic').mockResolvedValue(expectedEvents);

      const result = await controller.findPublic();

      expect(result).toEqual(expectedEvents);
      expect(service.findPublic).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockEvent);

      const result = await controller.findOne('1', req);

      expect(result).toEqual(mockEvent);
      expect(service.findOneById).toHaveBeenCalledWith(1, mockUser);
    });

    it('should return not found error', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'findOneById').mockResolvedValue(null);

      const result = await controller.findOne('999', req);

      expect(result).toEqual({ error: 'Not found' });
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const req = { user: mockUser };
      const eventData = { title: 'New Event', type: 'personal' };
      jest.spyOn(service, 'create').mockResolvedValue(mockEvent);

      const result = await controller.create(eventData, req);

      expect(result).toEqual(mockEvent);
      expect(service.create).toHaveBeenCalledWith(eventData, mockUser);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const req = { user: mockUser };
      const updateData = { title: 'Updated Event' };
      const updatedEvent = { ...mockEvent, ...updateData };
      jest.spyOn(service, 'update').mockResolvedValue(updatedEvent);

      const result = await controller.update('1', updateData, req);

      expect(result).toEqual(updatedEvent);
      expect(service.update).toHaveBeenCalledWith(1, updateData, mockUser);
    });

    it('should return not found error', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'update').mockResolvedValue(null);

      const result = await controller.update('999', {}, req);

      expect(result).toEqual({ error: 'Not found' });
    });
  });

  describe('remove', () => {
    it('should remove an event', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'remove').mockResolvedValue(true);

      const result = await controller.remove('1', req);

      expect(result).toEqual({ success: true });
      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
    });

    it('should return failure', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'remove').mockResolvedValue(false);

      const result = await controller.remove('999', req);

      expect(result).toEqual({ success: false });
    });
  });
}); 
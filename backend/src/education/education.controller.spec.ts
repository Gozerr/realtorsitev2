import { Test, TestingModule } from '@nestjs/testing';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';

describe('EducationController', () => {
  let controller: EducationController;
  let service: EducationService;

  const mockEvent = {
    id: 1,
    title: 'Test Education Event',
    description: 'Test Description',
    date: new Date(),
    type: 'course',
    isActive: true,
    link: 'https://example.com',
    img: 'image.jpg',
    place: 'Online',
    endDate: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EducationController],
      providers: [
        {
          provide: EducationService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EducationController>(EducationController);
    service = module.get<EducationService>(EducationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all education events', async () => {
      const expectedEvents = [mockEvent];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedEvents);

      const result = await controller.findAll();

      expect(result).toEqual(expectedEvents);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single education event', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should return null when event not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new education event', async () => {
      const eventData = {
        title: 'New Course',
        description: 'New Description',
        date: new Date(),
        type: 'course',
        isActive: true,
      };
      jest.spyOn(service, 'create').mockResolvedValue(mockEvent);

      const result = await controller.create(eventData);

      expect(result).toEqual(mockEvent);
      expect(service.create).toHaveBeenCalledWith(eventData);
    });
  });

  describe('update', () => {
    it('should update an education event', async () => {
      const updateData = { title: 'Updated Course' };
      const updatedEvent = { ...mockEvent, ...updateData };
      jest.spyOn(service, 'update').mockResolvedValue(updatedEvent);

      const result = await controller.update('1', updateData);

      expect(result).toEqual(updatedEvent);
      expect(service.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should return null when event not found', async () => {
      jest.spyOn(service, 'update').mockResolvedValue(null);

      const result = await controller.update('999', {});

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove an education event', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockEvent);

      const result = await controller.remove('1');

      expect(result).toEqual(mockEvent);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should return null when event not found', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(null);

      const result = await controller.remove('999');

      expect(result).toBeNull();
    });
  });
}); 
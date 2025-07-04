import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { Property, PropertyStatus } from './property.entity';
import { User, UserRole } from '../users/user.entity';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let service: PropertiesService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'agent@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.AGENT,
  };

  const mockProperty: Partial<Property> = {
    id: 1,
    title: 'Test Property',
    description: 'A test property',
    address: '123 Test St',
    price: 500000,
    area: 150,
    bedrooms: 3,
    bathrooms: 2,
    status: PropertyStatus.FOR_SALE,
    isExclusive: false,
    photos: [],
    agent: mockUser as User,
    createdAt: new Date(),
  };

  const mockCreatePropertyDto: CreatePropertyDto = {
    title: 'New Property',
    description: 'A new property',
    address: '456 New St',
    price: 600000,
    isExclusive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        {
          provide: PropertiesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllForAgent: jest.fn(),
            findOne: jest.fn(),
            updateStatus: jest.fn(),
            getStatistics: jest.fn(),
            findAllRecent: jest.fn(),
            getAllPhotos: jest.fn(),
            findByBoundingBox: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    service = module.get<PropertiesService>(PropertiesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a property', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockProperty as Property);

      const result = await controller.create(mockCreatePropertyDto, { user: mockUser });

      expect(result).toEqual(mockProperty);
      expect(service.create).toHaveBeenCalledWith(mockCreatePropertyDto, mockUser.id);
    });
  });

  describe('getProperties', () => {
    it('should return all properties when no agentId provided', async () => {
      const expectedResult = { properties: [mockProperty], total: 1 };
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

      const result = await controller.getProperties();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return properties for specific agent when agentId provided', async () => {
      const expectedResult = { properties: [mockProperty], total: 1 };
      jest.spyOn(service, 'findAllForAgent').mockResolvedValue(expectedResult);

      const result = await controller.getProperties('1');

      expect(result).toEqual(expectedResult);
      expect(service.findAllForAgent).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a single property', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProperty as Property);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockProperty);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.findOne('invalid')).rejects.toThrow('Некорректный id объекта');
    });

    it('should throw NotFoundException when property not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new Error('Property not found'));

      await expect(controller.findOne('999')).rejects.toThrow('Объект недвижимости не найден');
    });
  });

  describe('updateStatus', () => {
    it('should update property status', async () => {
      const updateData = { status: PropertyStatus.IN_DEAL };
      const updatedProperty = { ...mockProperty, status: PropertyStatus.IN_DEAL };
      jest.spyOn(service, 'updateStatus').mockResolvedValue(updatedProperty as Property);

      const result = await controller.updateStatus('1', updateData, { user: mockUser });

      expect(result).toEqual(updatedProperty);
      expect(service.updateStatus).toHaveBeenCalledWith(1, PropertyStatus.IN_DEAL, mockUser.id);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      const mockStats = { total: 10, forSale: 5, exclusives: 3 };
      jest.spyOn(service, 'getStatistics').mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(result).toEqual(mockStats);
      expect(service.getStatistics).toHaveBeenCalled();
    });
  });

  describe('findAllRecent', () => {
    it('should return recent properties', async () => {
      const expectedProperties = [mockProperty];
      jest.spyOn(service, 'findAllRecent').mockResolvedValue(expectedProperties as Property[]);

      const result = await controller.findAllRecent();

      expect(result).toEqual(expectedProperties);
      expect(service.findAllRecent).toHaveBeenCalled();
    });
  });

  describe('getAllPhotos', () => {
    it('should return all photos', async () => {
      const mockPhotos = ['photo1.jpg', 'photo2.jpg'];
      jest.spyOn(service, 'getAllPhotos').mockResolvedValue(mockPhotos);

      const result = await controller.getAllPhotos();

      expect(result).toEqual(mockPhotos);
      expect(service.getAllPhotos).toHaveBeenCalled();
    });
  });

  describe('getPropertiesByMap', () => {
    it('should return properties by bounding box', async () => {
      const bbox = '10,20,30,40';
      const query = { limit: 10, offset: 0 };
      const expectedProperties = [mockProperty];
      jest.spyOn(service, 'findByBoundingBox').mockResolvedValue(expectedProperties);

      const result = await controller.getPropertiesByMap(bbox, query);

      expect(result).toEqual(expectedProperties);
      expect(service.findByBoundingBox).toHaveBeenCalledWith(10, 20, 30, 40, { limit: 10, offset: 0 });
    });

    it('should throw BadRequestException for invalid bbox', async () => {
      const invalidBbox = 'invalid,bbox,format';
      const query = {};

      await expect(controller.getPropertiesByMap(invalidBbox, query)).rejects.toThrow('Некорректные координаты bbox');
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertiesService } from './properties.service';
import { Property, PropertyStatus } from './property.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.entity';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let propertiesRepository: Repository<Property>;
  let notificationsService: NotificationsService;
  let userRepository: Repository<User>;

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    description: 'Test Description',
    address: 'Test Address',
    price: 100000,
    area: 100,
    bedrooms: 3,
    bathrooms: 2,
    status: PropertyStatus.FOR_SALE,
    isExclusive: false,
    photos: [],
    agent: {
      id: 1,
      email: 'agent@realtorsite.com',
      password: 'hashed',
      firstName: 'Agent',
      lastName: 'Smith',
      photo: '',
      phone: '',
      city: '',
      region: '',
      role: UserRole.AGENT,
      agency: { id: 1, name: 'Test Agency', users: [] },
      properties: [],
      clients: [],
      telegramId: '',
    },
    createdAt: new Date(),
    lat: 0,
    lng: 0,
    floor: 0,
    totalFloors: 0,
    link: '',
    pricePerM2: 0,
    externalId: '',
    seller: '',
    datePublished: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getRepositoryToken(Property),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findAndCount: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockProperty], 1]),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<PropertiesService>(PropertiesService);
    propertiesRepository = module.get<Repository<Property>>(getRepositoryToken(Property));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return properties with pagination', async () => {
      const mockProperties = [mockProperty];
      const mockTotal = 1;
      
      jest.spyOn(propertiesRepository, 'findAndCount').mockResolvedValue([mockProperties, mockTotal]);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result.properties).toEqual(mockProperties);
      expect(result.total).toBe(mockTotal);
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      jest.spyOn(propertiesRepository, 'findOne').mockResolvedValue(mockProperty);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundException when property not found', async () => {
      jest.spyOn(propertiesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const createDto = {
        title: 'New Property',
        description: 'New Description',
        address: 'New Address',
        price: 200000,
        area: 150,
        bedrooms: 4,
        bathrooms: 3,
      };

      jest.spyOn(propertiesRepository, 'create').mockReturnValue(mockProperty);
      jest.spyOn(propertiesRepository, 'save').mockResolvedValue(mockProperty);
      jest.spyOn(notificationsService, 'create').mockResolvedValue({ id: 1, title: '', userId: 1, type: '', category: '', description: '', isNew: false, createdAt: new Date() });

      const result = await service.create(createDto, 1);

      expect(result).toEqual(mockProperty);
      expect(notificationsService.create).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return property statistics', async () => {
      jest.spyOn(propertiesRepository, 'count').mockResolvedValue(10);
      jest.spyOn(propertiesRepository, 'count').mockResolvedValueOnce(10);
      jest.spyOn(propertiesRepository, 'count').mockResolvedValueOnce(5);
      jest.spyOn(propertiesRepository, 'count').mockResolvedValueOnce(2);

      const result = await service.getStatistics();

      expect(result.total).toBe(10);
      expect(result.forSale).toBe(5);
      expect(result.exclusives).toBe(2);
    });
  });
}); 
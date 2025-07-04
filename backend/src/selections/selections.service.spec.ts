import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SelectionsService } from './selections.service';
import { Selection } from './selection.entity';
import { User, UserRole } from '../users/user.entity';
import { Property, PropertyStatus } from '../properties/property.entity';

// Mock PDFKit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    end: jest.fn(),
    on: jest.fn(),
  }));
});

describe('SelectionsService', () => {
  let service: SelectionsService;
  let selectionsRepository: Repository<Selection>;
  let propertyRepository: Repository<Property>;

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

  const mockSelection: Partial<Selection> = {
    id: 1,
    title: 'Test Selection',
    propertyIds: [1, 2, 3],
    user: mockUser as User,
    createdAt: new Date(),
    clientToken: 'test-token-123',
    clientLikes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelectionsService,
        {
          provide: getRepositoryToken(Selection),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Property),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SelectionsService>(SelectionsService);
    selectionsRepository = module.get<Repository<Selection>>(getRepositoryToken(Selection));
    propertyRepository = module.get<Repository<Property>>(getRepositoryToken(Property));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return all selections for user', async () => {
      const mockSelections = [mockSelection];
      jest.spyOn(selectionsRepository, 'find').mockResolvedValue(mockSelections as Selection[]);

      const result = await service.findAllByUser(mockUser as User);

      expect(result).toEqual(mockSelections);
      expect(selectionsRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOneById', () => {
    it('should return selection by id for user', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(mockSelection as Selection);

      const result = await service.findOneById(1, mockUser as User);

      expect(result).toEqual(mockSelection);
      expect(selectionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: mockUser.id } },
      });
    });

    it('should return null when selection not found', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOneById(999, mockUser as User);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new selection', async () => {
      const title = 'New Selection';
      const propertyIds = [1, 2, 3];

      jest.spyOn(selectionsRepository, 'create').mockReturnValue(mockSelection as Selection);
      jest.spyOn(selectionsRepository, 'save').mockResolvedValue(mockSelection as Selection);

      const result = await service.create(title, propertyIds, mockUser as User);

      expect(result).toEqual(mockSelection);
      expect(selectionsRepository.create).toHaveBeenCalledWith({
        title,
        propertyIds,
        user: mockUser,
        clientToken: expect.any(String),
        clientLikes: [],
      });
      expect(selectionsRepository.save).toHaveBeenCalledWith(mockSelection);
    });
  });

  describe('update', () => {
    it('should update existing selection', async () => {
      const title = 'Updated Selection';
      const propertyIds = [4, 5, 6];

      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(mockSelection as Selection);
      jest.spyOn(selectionsRepository, 'save').mockResolvedValue({
        ...mockSelection,
        title,
        propertyIds,
      } as Selection);

      const result = await service.update(1, title, propertyIds, mockUser as User);

      expect(result!.title).toBe(title);
      expect(result!.propertyIds).toEqual(propertyIds);
      expect(selectionsRepository.save).toHaveBeenCalled();
    });

    it('should return null when selection not found', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.update(999, 'Title', [1], mockUser as User);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove selection', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(mockSelection as Selection);
      jest.spyOn(selectionsRepository, 'remove').mockResolvedValue(mockSelection as any);

      const result = await service.remove(1, mockUser as User);

      expect(result).toBe(true);
      expect(selectionsRepository.remove).toHaveBeenCalledWith(mockSelection);
    });

    it('should return false when selection not found', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.remove(999, mockUser as User);

      expect(result).toBe(false);
    });
  });

  describe('findByClientToken', () => {
    it('should return selection with properties for client token', async () => {
      const mockProperties = [mockProperty];
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(mockSelection as Selection);
      jest.spyOn(propertyRepository, 'find').mockResolvedValue(mockProperties as Property[]);

      const result = await service.findByClientToken('test-token-123');

      expect(result).toEqual({
        id: mockSelection.id,
        title: mockSelection.title,
        properties: mockProperties.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          address: p.address,
          price: p.price,
          area: p.area,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          status: p.status,
          isExclusive: p.isExclusive,
          photos: p.photos,
          createdAt: p.createdAt,
          lat: p.lat,
          lng: p.lng,
          floor: p.floor,
          totalFloors: p.totalFloors,
          link: p.link,
          pricePerM2: p.pricePerM2,
          externalId: p.externalId,
          seller: p.seller,
          datePublished: p.datePublished,
        })),
        clientLikes: mockSelection.clientLikes,
      });
    });

    it('should return null when token not found', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByClientToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('saveClientLike', () => {
    it('should save client like for property', async () => {
      const selectionWithLikes = { ...mockSelection, clientLikes: [] };
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(selectionWithLikes as Selection);
      jest.spyOn(selectionsRepository, 'save').mockResolvedValue(selectionWithLikes as Selection);

      const result = await service.saveClientLike('test-token-123', 1, true);

      expect(result).toBe(true);
      expect(selectionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          clientLikes: [{ propertyId: 1, liked: true }],
        })
      );
    });

    it('should update existing like', async () => {
      const selectionWithLikes = {
        ...mockSelection,
        clientLikes: [{ propertyId: 1, liked: false }],
      };
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(selectionWithLikes as Selection);
      jest.spyOn(selectionsRepository, 'save').mockResolvedValue(selectionWithLikes as Selection);

      const result = await service.saveClientLike('test-token-123', 1, true);

      expect(result).toBe(true);
    });

    it('should return false when token not found', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.saveClientLike('invalid-token', 1, true);

      expect(result).toBe(false);
    });
  });

  describe('getClientLikesForAgent', () => {
    it('should return client likes for agent', async () => {
      const likes = [{ propertyId: 1, liked: true }];
      const selectionWithLikes = { ...mockSelection, clientLikes: likes };
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(selectionWithLikes as Selection);

      const result = await service.getClientLikesForAgent(1, mockUser as User);

      expect(result).toEqual(likes);
    });

    it('should return empty array when selection not found', async () => {
      jest.spyOn(selectionsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getClientLikesForAgent(999, mockUser as User);

      expect(result).toEqual([]);
    });
  });
}); 
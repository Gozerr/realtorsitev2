import { Test, TestingModule } from '@nestjs/testing';
import { SelectionsController } from './selections.controller';
import { SelectionsService } from './selections.service';
import { User, UserRole } from '../users/user.entity';
import { Property, PropertyStatus } from '../properties/property.entity';

describe('SelectionsController', () => {
  let controller: SelectionsController;
  let service: SelectionsService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'agent@example.com',
    firstName: 'Agent',
    lastName: 'Test',
    role: UserRole.AGENT,
  };

  const mockProperty: Partial<Property> = {
    id: 1,
    title: 'Test Property',
    price: 100000,
    area: 100,
    status: PropertyStatus.AVAILABLE,
  };

  const mockSelection = {
    id: 1,
    title: 'Test Selection',
    propertyIds: [1, 2, 3],
    user: mockUser,
    clientToken: 'test-token-123',
    clientLikes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelectionsController],
      providers: [
        {
          provide: SelectionsService,
          useValue: {
            findAllByUser: jest.fn(),
            findOneById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findByClientToken: jest.fn(),
            saveClientLike: jest.fn(),
            getClientLikesForAgent: jest.fn(),
            generatePdf: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SelectionsController>(SelectionsController);
    service = module.get<SelectionsService>(SelectionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all selections for user', async () => {
      const req = { user: mockUser };
      const expectedSelections = [mockSelection];
      jest.spyOn(service, 'findAllByUser').mockResolvedValue(expectedSelections);

      const result = await controller.findAll(req);

      expect(result).toEqual(expectedSelections.map(({ user, ...rest }) => rest));
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single selection', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockSelection);

      const result = await controller.findOne('1', req);

      expect(result).toEqual({ ...mockSelection, user: undefined });
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
    it('should create a new selection', async () => {
      const req = { user: mockUser };
      const createData = { title: 'New Selection', propertyIds: [1, 2] };
      jest.spyOn(service, 'create').mockResolvedValue(mockSelection);

      const result = await controller.create(createData, req);

      expect(result).toEqual(mockSelection);
      expect(service.create).toHaveBeenCalledWith(createData.title, createData.propertyIds, mockUser);
    });
  });

  describe('update', () => {
    it('should update a selection', async () => {
      const req = { user: mockUser };
      const updateData = { title: 'Updated Selection', propertyIds: [4, 5] };
      const updatedSelection = { ...mockSelection, ...updateData };
      jest.spyOn(service, 'update').mockResolvedValue(updatedSelection);

      const result = await controller.update('1', updateData, req);

      expect(result).toEqual(updatedSelection);
      expect(service.update).toHaveBeenCalledWith(1, updateData.title, updateData.propertyIds, mockUser);
    });

    it('should return not found error', async () => {
      const req = { user: mockUser };
      jest.spyOn(service, 'update').mockResolvedValue(null);

      const result = await controller.update('999', {}, req);

      expect(result).toEqual({ error: 'Not found' });
    });
  });

  describe('remove', () => {
    it('should remove a selection', async () => {
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

  describe('getClientSelection', () => {
    it('should return client selection data', async () => {
      const clientData = {
        id: 1,
        title: 'Client Selection',
        properties: [mockProperty],
        clientLikes: [],
      };
      jest.spyOn(service, 'findByClientToken').mockResolvedValue(clientData);

      const result = await controller.getClientSelection('test-token-123');

      expect(result).toEqual(clientData);
      expect(service.findByClientToken).toHaveBeenCalledWith('test-token-123');
    });

    it('should return not found error', async () => {
      jest.spyOn(service, 'findByClientToken').mockResolvedValue(null);

      const result = await controller.getClientSelection('invalid-token');

      expect(result).toEqual({ error: 'Not found' });
    });
  });

  describe('saveClientLike', () => {
    it('should save client like', async () => {
      const likeData = { propertyId: 1, liked: true };
      jest.spyOn(service, 'saveClientLike').mockResolvedValue(true);

      const result = await controller.saveClientLike('test-token-123', likeData);

      expect(result).toEqual({ success: true });
      expect(service.saveClientLike).toHaveBeenCalledWith('test-token-123', 1, true);
    });

    it('should return failure', async () => {
      const likeData = { propertyId: 1, liked: true };
      jest.spyOn(service, 'saveClientLike').mockResolvedValue(false);

      const result = await controller.saveClientLike('invalid-token', likeData);

      expect(result).toEqual({ success: false });
    });
  });

  describe('getClientLikesForAgent', () => {
    it('should return client likes for agent', async () => {
      const req = { user: mockUser };
      const likes = [{ propertyId: 1, liked: true }];
      jest.spyOn(service, 'getClientLikesForAgent').mockResolvedValue(likes);

      const result = await controller.getClientLikesForAgent('1', req);

      expect(result).toEqual(likes);
      expect(service.getClientLikesForAgent).toHaveBeenCalledWith(1, mockUser);
    });
  });

  describe('generatePdf', () => {
    it('should generate PDF for selection', async () => {
      const req = { user: mockUser };
      const res = {
        set: jest.fn(),
        send: jest.fn(),
      };
      const pdfBuffer = Buffer.from('test pdf content');
      jest.spyOn(service, 'generatePdf').mockResolvedValue(pdfBuffer);

      await controller.generatePdf('1', req, res);

      expect(service.generatePdf).toHaveBeenCalledWith(1, mockUser);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.set).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=selection-1.pdf');
      expect(res.send).toHaveBeenCalledWith(pdfBuffer);
    });

    it('should handle null PDF buffer', async () => {
      const req = { user: mockUser };
      const res = {
        set: jest.fn(),
        send: jest.fn(),
      };
      jest.spyOn(service, 'generatePdf').mockResolvedValue(null);

      await controller.generatePdf('999', req, res);

      expect(res.send).toHaveBeenCalledWith({ error: 'Selection not found or PDF generation failed' });
    });
  });
}); 
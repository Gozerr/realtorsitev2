import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Client, ClientStatus } from './client.entity';
import { User, UserRole } from '../users/user.entity';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'agent@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.AGENT,
  };

  const mockClient: Partial<Client> = {
    id: 1,
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1234567890',
    status: ClientStatus.NEW,
    agent: mockUser as User,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateClientDto: CreateClientDto = {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1234567890',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllForAgent: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a client', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockClient as Client);

      const result = await controller.create(mockCreateClientDto, { user: mockUser });

      expect(result).toEqual(mockClient);
      expect(service.create).toHaveBeenCalledWith(mockCreateClientDto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return all clients for agent', async () => {
      const expectedClients = [
        { ...mockClient, id: 1 },
        { ...mockClient, id: 2, name: 'Jane Doe', email: 'jane@example.com' },
      ];
      jest.spyOn(service, 'findAllForAgent').mockResolvedValue(expectedClients as Client[]);

      const result = await controller.findAll({ user: mockUser });

      expect(result).toEqual(expectedClients);
      expect(service.findAllForAgent).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return a single client', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient as Client);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockClient);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should return null when client not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedClient = { ...mockClient, ...updateData };
      jest.spyOn(service, 'update').mockResolvedValue(updatedClient as Client);

      const result = await controller.update('1', updateData);

      expect(result).toEqual(updatedClient);
      expect(service.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should return null when client not found for update', async () => {
      const updateData = { name: 'Updated Name' };
      jest.spyOn(service, 'update').mockResolvedValue(null);

      const result = await controller.update('999', updateData);

      expect(result).toBeNull();
      expect(service.update).toHaveBeenCalledWith(999, updateData);
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should handle removal of non-existent client', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      const result = await controller.remove('999');

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client, ClientStatus } from './client.entity';
import { User, UserRole } from '../users/user.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientsRepository: Repository<Client>;

  const mockClient = {
    id: 1,
    name: 'Test Client',
    email: 'client@test.com',
    phone: '1234567890',
    status: ClientStatus.NEW,
    agent: {
      id: 1,
      email: 'agent@test.com',
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
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    clientsRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForAgent', () => {
    it('should return clients for agent', async () => {
      const mockClients = [mockClient];
      jest.spyOn(clientsRepository, 'find').mockResolvedValue(mockClients);

      const result = await service.findAllForAgent(1);

      expect(result).toEqual(mockClients);
      expect(clientsRepository.find).toHaveBeenCalledWith({
        where: { agent: { id: 1 } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const createDto = {
        name: 'New Client',
        email: 'new@test.com',
        phone: '0987654321',
      };

      jest.spyOn(clientsRepository, 'create').mockReturnValue(mockClient);
      jest.spyOn(clientsRepository, 'save').mockResolvedValue(mockClient);

      const result = await service.create(createDto, 1);

      expect(result).toEqual(mockClient);
      expect(clientsRepository.create).toHaveBeenCalledWith({
        ...createDto,
        agent: { id: 1 },
      });
      expect(clientsRepository.save).toHaveBeenCalledWith(mockClient);
    });
  });
}); 
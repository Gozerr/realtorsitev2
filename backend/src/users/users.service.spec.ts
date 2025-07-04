import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { AgenciesService } from '../agencies/agencies.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;
  let agenciesService: AgenciesService;

  const mockUser = {
    id: 1,
    email: 'admin@realtorsite.com',
    password: 'hashed',
    firstName: 'Admin',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AgenciesService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    agenciesService = module.get<AgenciesService>(AgenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByEmail', () => {
    it('should return user by email', async () => {
      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('admin@realtorsite.com');

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email: 'admin@realtorsite.com' });
    });
  });

  describe('findOneById', () => {
    it('should return user by id', async () => {
      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.findOneById(1);

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.AGENT,
        agencyId: 1,
      };

      const { password, ...expectedResult } = mockUser;
      jest.spyOn(usersRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        role: createDto.role,
        password: expect.any(String), // bcrypt hash
        agency: { id: createDto.agencyId },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = { firstName: 'Updated', phone: '1234567890' };
      const { password, ...expectedResult } = mockUser;

      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(usersRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateProfile(1, updateData);

      expect(result).toEqual(expectedResult);
      expect(usersRepository.update).toHaveBeenCalledWith(1, updateData);
    });
  });
}); 
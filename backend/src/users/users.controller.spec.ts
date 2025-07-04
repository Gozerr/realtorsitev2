import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    role: UserRole.AGENT,
  };

  const mockCreateUserDto: CreateUserDto = {
    email: 'new@example.com',
    password: 'password123',
    firstName: 'New',
    lastName: 'User',
    phone: '0987654321',
    role: UserRole.AGENT,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOneById: jest.fn(),
            updateProfile: jest.fn(),
            importUsers: jest.fn(),
            importUsersAsync: jest.fn(),
            getImportStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const expectedResult = { ...mockUser, password: undefined };
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult as User);

      const result = await controller.create(mockCreateUserDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: { id: 1 } };
      jest.spyOn(service, 'findOneById').mockResolvedValue(mockUser as User);

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
      expect(service.findOneById).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const req = { user: { id: 1 } };
      const updateData = { firstName: 'Updated', phone: '1111111111' };
      const expectedResult = { ...mockUser, ...updateData };
      
      jest.spyOn(service, 'updateProfile').mockResolvedValue(expectedResult as User);

      const result = await controller.updateProfile(updateData, req);

      expect(result).toEqual(expectedResult);
      expect(service.updateProfile).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw error when user ID not found', async () => {
      const req = { user: {} };
      const updateData = { firstName: 'Updated' };

      await expect(controller.updateProfile(updateData, req)).rejects.toThrow('User ID not found in JWT token');
    });
  });

  describe('importUsers', () => {
    it('should import users synchronously', async () => {
      const users = [
        { email: 'user1@example.com', firstName: 'User1', lastName: 'Test' },
        { email: 'user2@example.com', firstName: 'User2', lastName: 'Test' },
      ];
      const expectedResult = { success: true, imported: 2 };
      
      jest.spyOn(service, 'importUsers').mockResolvedValue(expectedResult);

      const result = await controller.importUsers(users);

      expect(result).toEqual(expectedResult);
      expect(service.importUsers).toHaveBeenCalledWith(users);
    });
  });

  describe('importUsersAsync', () => {
    it('should import users asynchronously', async () => {
      const users = [
        { email: 'user1@example.com', firstName: 'User1', lastName: 'Test' },
      ];
      const expectedResult = { taskId: 'task-123', status: 'started' };
      
      jest.spyOn(service, 'importUsersAsync').mockResolvedValue(expectedResult);

      const result = await controller.importUsersAsync(users);

      expect(result).toEqual(expectedResult);
      expect(service.importUsersAsync).toHaveBeenCalledWith(users);
    });
  });

  describe('getImportStatus', () => {
    it('should return import status', async () => {
      const taskId = 'task-123';
      const expectedResult = { 
        taskId, 
        status: 'completed', 
        progress: 100, 
        imported: 5, 
        errors: [] 
      };
      
      jest.spyOn(service, 'getImportStatus').mockResolvedValue(expectedResult);

      const result = await controller.getImportStatus(taskId);

      expect(result).toEqual(expectedResult);
      expect(service.getImportStatus).toHaveBeenCalledWith(taskId);
    });
  });
}); 
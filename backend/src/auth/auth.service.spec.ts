import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    email: 'admin@realtorsite.com',
    password: '$2a$10$hashedpassword',
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
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if password is valid', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      
      const result = await service.validateUser('admin@realtorsite.com', 'password123');
      
      expect(result.email).toBe('admin@realtorsite.com');
      expect(result.password).toBeUndefined(); // password should be removed
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);
      
      const result = await service.validateUser('notfound@mail.com', 'password');
      
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      
      const result = await service.validateUser('admin@realtorsite.com', 'wrong');
      
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and user without password', async () => {
      const result = await service.login(mockUser);
      
      expect(result.access_token).toBe('jwt-token');
      expect(result.user.email).toBe('admin@realtorsite.com');
      expect(result.user.password).toBeUndefined();
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'admin@realtorsite.com',
        sub: 1,
        role: UserRole.AGENT,
      });
    });
  });
}); 
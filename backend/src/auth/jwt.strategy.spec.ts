import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.AGENT,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user', async () => {
      const payload = { userId: 1, email: 'test@example.com' };
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(mockUser as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 1,
        email: 'test@example.com',
        role: UserRole.AGENT,
      });
      expect(usersService.findOneById).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      const payload = { userId: 999, email: 'nonexistent@example.com' };
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(null);

      const result = await strategy.validate(payload);

      expect(result).toBeNull();
      expect(usersService.findOneById).toHaveBeenCalledWith(999);
    });

    it('should handle service errors gracefully', async () => {
      const payload = { userId: 1, email: 'test@example.com' };
      jest.spyOn(usersService, 'findOneById').mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow('Database error');
    });
  });

  describe('configuration', () => {
    it('should have correct JWT options', () => {
      expect(strategy).toHaveProperty('_secretOrKeyProvider');
      expect(strategy).toHaveProperty('_jwtFromRequest');
    });

    it('should use config service for secret', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
}); 
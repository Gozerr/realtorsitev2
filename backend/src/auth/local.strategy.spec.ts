import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

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
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as User);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'wrongpassword';
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when validation fails', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle service errors gracefully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      jest.spyOn(authService, 'validateUser').mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(email, password)).rejects.toThrow('Database error');
    });
  });
}); 
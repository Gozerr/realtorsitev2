import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../users/user.entity';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  let authService: AuthService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.AGENT,
  };

  const mockRequest = {
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
    user: null,
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockExecutionContext: ExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getType: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalAuthGuard,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access with valid credentials', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as User);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should throw UnauthorizedException when user validation fails', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when credentials are missing', async () => {
      const contextWithoutCredentials = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ body: {} }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutCredentials)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const contextWithoutEmail = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ body: { password: 'password123' } }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutEmail)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is missing', async () => {
      const contextWithoutPassword = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ body: { email: 'test@example.com' } }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutPassword)).rejects.toThrow(UnauthorizedException);
    });

    it('should set user in request when authentication succeeds', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as User);

      const request = { body: { email: 'test@example.com', password: 'password123' }, user: null };
      const context = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      await guard.canActivate(context);

      expect(request['user']).toEqual(mockUser);
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(authService, 'validateUser').mockRejectedValue(new Error('Database error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Database error');
    });
  });
}); 
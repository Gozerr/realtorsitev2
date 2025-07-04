import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { User, UserRole } from '../../users/user.entity';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.AGENT,
  };

  const mockRequest = {
    headers: {
      authorization: 'Bearer test-jwt-token',
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
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access with valid JWT token', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(mockUser as User);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('test-jwt-token');
      expect(usersService.findOneById).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException when no authorization header', async () => {
      const contextWithoutAuth = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ headers: {} }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutAuth)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when invalid authorization format', async () => {
      const contextWithInvalidAuth = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ headers: { authorization: 'InvalidFormat' } }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithInvalidAuth)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: 999, email: 'nonexistent@example.com' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should set user in request when authentication succeeds', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(mockUser as User);

      const request = { headers: { authorization: 'Bearer test-jwt-token' }, user: null };
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
      const payload = { sub: 1, email: 'test@example.com' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(usersService, 'findOneById').mockRejectedValue(new Error('Database error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Database error');
    });
  });
}); 
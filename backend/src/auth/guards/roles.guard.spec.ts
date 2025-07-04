import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { User, UserRole } from '../../users/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.AGENT,
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: mockUser,
      }),
    }),
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      const requiredRoles = [UserRole.AGENT, UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user is admin', () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const contextWithAdmin = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: adminUser,
          }),
        }),
      } as ExecutionContext;
      const requiredRoles = [UserRole.AGENT];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const result = guard.canActivate(contextWithAdmin);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const contextWithoutUser = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
      } as ExecutionContext;
      const requiredRoles = [UserRole.AGENT];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      expect(() => guard.canActivate(contextWithoutUser)).toThrow(ForbiddenException);
    });

    it('should handle multiple required roles', () => {
      const requiredRoles = [UserRole.AGENT, UserRole.MANAGER];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user role is not in required roles', () => {
      const managerUser = { ...mockUser, role: UserRole.MANAGER };
      const contextWithManager = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: managerUser,
          }),
        }),
      } as ExecutionContext;
      const requiredRoles = [UserRole.AGENT, UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      expect(() => guard.canActivate(contextWithManager)).toThrow(ForbiddenException);
    });
  });
}); 
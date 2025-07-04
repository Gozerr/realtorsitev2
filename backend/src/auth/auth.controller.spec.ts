import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.AGENT,
  };

  const mockLoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockAccessToken = 'mock-jwt-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            changePassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            verifyEmail: jest.fn(),
            resendVerification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      jest.spyOn(service, 'login').mockResolvedValue({
        access_token: mockAccessToken,
        user: mockUser,
      });

      const result = await controller.login(mockLoginDto);

      expect(result).toEqual({
        access_token: mockAccessToken,
        user: mockUser,
      });
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
    });

    it('should handle login errors', async () => {
      const errorMessage = 'Invalid credentials';
      jest.spyOn(service, 'login').mockRejectedValue(new Error(errorMessage));

      await expect(controller.login(mockLoginDto)).rejects.toThrow(errorMessage);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const adminUser = { ...mockUser, role: UserRole.AGENT };
      jest.spyOn(service, 'register').mockResolvedValue({
        access_token: mockAccessToken,
        user: adminUser,
      });

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        access_token: mockAccessToken,
        user: adminUser,
      });
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'refresh-token';
      jest.spyOn(service, 'refreshToken').mockResolvedValue({
        access_token: 'new-access-token',
      });

      const result = await controller.refreshToken({ refresh_token: refreshToken });

      expect(result).toEqual({
        access_token: 'new-access-token',
      });
      expect(service.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      jest.spyOn(service, 'logout').mockResolvedValue({ message: 'Logged out successfully' });

      const result = await controller.logout({ user: mockUser });

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(service.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      jest.spyOn(service, 'changePassword').mockResolvedValue({ message: 'Password changed successfully' });

      const result = await controller.changePassword(changePasswordDto, { user: mockUser });

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(service.changePassword).toHaveBeenCalledWith(mockUser.id, changePasswordDto);
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      jest.spyOn(service, 'forgotPassword').mockResolvedValue({ message: 'Reset email sent' });

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual({ message: 'Reset email sent' });
      expect(service.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto.email);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with token', async () => {
      const resetPasswordDto = {
        token: 'reset-token',
        newPassword: 'newpassword',
      };

      jest.spyOn(service, 'resetPassword').mockResolvedValue({ message: 'Password reset successfully' });

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(service.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with token', async () => {
      const verifyEmailDto = { token: 'verification-token' };
      jest.spyOn(service, 'verifyEmail').mockResolvedValue({ message: 'Email verified successfully' });

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(result).toEqual({ message: 'Email verified successfully' });
      expect(service.verifyEmail).toHaveBeenCalledWith(verifyEmailDto.token);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const resendVerificationDto = { email: 'test@example.com' };
      jest.spyOn(service, 'resendVerification').mockResolvedValue({ message: 'Verification email sent' });

      const result = await controller.resendVerification(resendVerificationDto);

      expect(result).toEqual({ message: 'Verification email sent' });
      expect(service.resendVerification).toHaveBeenCalledWith(resendVerificationDto.email);
    });
  });
}); 
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../users/refresh-token.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const { password, ...userWithoutPassword } = user;
    const access_token = this.jwtService.sign(payload);
    // Генерируем refresh token
    const refresh_token = uuidv4();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
    await this.refreshTokenRepo.save({
      token: refresh_token,
      userId: user.id,
      expires,
    });
    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  async refreshToken(refresh_token: string) {
    const tokenEntity = await this.refreshTokenRepo.findOne({ where: { token: refresh_token } });
    if (!tokenEntity) {
      this.logger?.warn?.(`Suspicious refresh attempt: invalid or expired token: ${refresh_token}`);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    if (tokenEntity.expires < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    const payload = { sub: tokenEntity.userId };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  async logout(refresh_token: string) {
    await this.refreshTokenRepo.delete({ token: refresh_token });
    return { message: 'Logged out' };
  }
}

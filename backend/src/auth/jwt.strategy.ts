import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY', // Тот же ключ, что и в auth.module.ts
    });
  }

  async validate(payload: any) {
    // Получаем пользователя из базы, чтобы добавить telegramId
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      return { id: payload.sub, email: payload.email, role: payload.role };
    }
    // Возвращаем нужные поля, включая telegramId
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      telegramId: user.telegramId,
    };
  }
} 
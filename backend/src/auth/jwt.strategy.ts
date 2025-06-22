import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY', // Тот же ключ, что и в auth.module.ts
    });
  }

  async validate(payload: any) {
    // В payload будут те данные, которые мы зашифровали в auth.service
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
} 
import { Controller, Post, UseGuards, Request, Body, Response, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res() res: ExpressResponse) {
    const result: any = await this.authService.login(req.user);
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    });
    delete result.refresh_token;
    return res.json(result);
  }

  @Post('refresh')
  async refresh(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    const refresh_token = req.cookies['refresh_token'];
    const result = await this.authService.refreshToken(refresh_token);
    return res.json(result);
  }

  @Post('logout')
  async logout(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    const refresh_token = req.cookies['refresh_token'];
    await this.authService.logout(refresh_token);
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res.json({ message: 'Logged out' });
  }
}

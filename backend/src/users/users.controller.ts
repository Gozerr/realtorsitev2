import { Controller, Post, Body, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Body() updateData: Partial<CreateUserDto>, @Request() req) {
    console.log('updateProfile controller called with:', { updateData, user: req.user });
    
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    
    console.log('Extracted userId:', userId);
    return this.usersService.updateProfile(userId, updateData);
  }
}

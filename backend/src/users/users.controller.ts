import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param } from '@nestjs/common';
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
  async getProfile(@Request() req) {
    const userId = req.user.id;
    return this.usersService.findOneById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Body() updateData: Partial<CreateUserDto>, @Request() req) {
    console.log('updateProfile controller called with:', { updateData, user: req.user });
    
    const userId = req.user.id;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    
    console.log('Extracted userId:', userId);
    return this.usersService.updateProfile(userId, updateData);
  }

  @Post('import')
  async importUsers(@Body() users: Array<any>) {
    // users: [{ email, firstName, lastName, phone, photo, agencyId, agencyName, ... }]
    return this.usersService.importUsers(users);
  }

  @Post('import/async')
  async importUsersAsync(@Body() users: Array<any>) {
    return this.usersService.importUsersAsync(users);
  }

  @Get('import/status/:taskId')
  getImportStatus(@Param('taskId') taskId: string) {
    return this.usersService.getImportStatus(taskId);
  }
}

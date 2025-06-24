import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async create(userData: CreateUserDto): Promise<Omit<User, 'password'>> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const { agencyId, ...restUserData } = userData;

    const newUser = this.usersRepository.create({
      ...restUserData,
      password: hashedPassword,
      agency: { id: agencyId },
    });
    
    const savedUser = await this.usersRepository.save(newUser);
    const { password, ...result } = savedUser;
    return result;
  }

  private async deleteOldAvatar(photoUrl: string): Promise<void> {
    try {
      // Извлекаем имя файла из URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Проверяем, что это наш файл (начинается с avatar_)
      if (fileName && fileName.startsWith('avatar_')) {
        const filePath = path.join(__dirname, '..', 'uploads', fileName);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Old avatar deleted:', fileName);
        }
      }
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  }

  async updateProfile(userId: number, updateData: Partial<CreateUserDto>): Promise<Omit<User, 'password'>> {
    console.log('updateProfile called with:', { userId, updateData });
    
    const user = await this.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Обновляем только разрешенные поля
    const allowedFields = ['firstName', 'lastName', 'photo'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as Partial<CreateUserDto>);

    console.log('Filtered data:', filteredData);

    // Проверяем, что есть данные для обновления
    if (Object.keys(filteredData).length === 0) {
      console.log('No data to update, returning current user');
      // Если нет данных для обновления, просто возвращаем текущего пользователя
      const { password, ...result } = user;
      return result;
    }

    // Если обновляется фото, удаляем старое
    if (filteredData.photo && user.photo && user.photo !== filteredData.photo) {
      await this.deleteOldAvatar(user.photo);
    }

    console.log('Updating user with data:', filteredData);
    await this.usersRepository.update(userId, filteredData);
    
    const updatedUser = await this.findOneById(userId);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    const { password, ...result } = updatedUser;
    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as fs from 'fs';
import * as path from 'path';
import { AgenciesService } from '../agencies/agencies.service';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};
const importQueue = new Queue('user-import', { connection: redisConnection });
const importStatus: Record<string, any> = {};

// Тип для результата импорта одного пользователя
export interface ImportUserResult {
  email: string;
  agency: string | number | undefined;
  action: string | null;
  user: User | Record<string, any> | null;
  agencyError: string | null;
  userError: string | null;
  success: boolean;
}

// Воркер для обработки задач импорта
// new Worker('user-import', async (job: Job) => {
//   ...
// });

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private agenciesService: AgenciesService,
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
    const allowedFields = ['firstName', 'lastName', 'photo', 'phone'];
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

  async importUsers(users: Array<any>): Promise<{
    total: number;
    imported: number;
    failed: number;
    results: ImportUserResult[];
  }> {
    const results: ImportUserResult[] = [];
    for (const userData of users) {
      let agencyId = userData.agencyId;
      let agencyError: string | null = null;
      let userError: string | null = null;
      let userResult: User | Record<string, any> | null = null;
      let action: string | null = null;
      try {
        if (!agencyId && userData.agencyName) {
          let agency = (await this.agenciesService.findAll()).find((a: any) => a.name === userData.agencyName);
          if (!agency) {
            try {
              agency = await this.agenciesService.create({ name: userData.agencyName });
            } catch (err: any) {
              agencyError = 'Ошибка создания агентства: ' + err.message;
            }
          }
          agencyId = agency?.id;
        }
        let user = await this.findOneByEmail(userData.email);
        if (user) {
          try {
            await this.usersRepository.update(user.id, {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              photo: userData.photo,
              agency: agencyId ? { id: agencyId } : undefined,
            });
            user = await this.findOneById(user.id);
            userResult = user;
            action = 'updated';
          } catch (err: any) {
            userError = 'Ошибка обновления пользователя: ' + err.message;
          }
        } else {
          try {
            const newUser = this.usersRepository.create({
              email: userData.email,
              password: userData.password || Math.random().toString(36).slice(-8),
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              photo: userData.photo,
              role: userData.role || 'agent',
              agency: agencyId ? { id: agencyId } : undefined,
            });
            const savedUser = await this.usersRepository.save(newUser);
            const { password, ...result } = savedUser;
            userResult = result;
            action = 'created';
          } catch (err: any) {
            userError = 'Ошибка создания пользователя: ' + err.message;
          }
        }
      } catch (err: any) {
        userError = 'Общая ошибка: ' + err.message;
      }
      results.push({
        email: userData.email,
        agency: userData.agencyName || userData.agencyId,
        action,
        user: userResult,
        agencyError,
        userError,
        success: !userError && !agencyError,
      });
    }
    return {
      total: users.length,
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  async importUsersAsync(users: Array<any>) {
    const job = await importQueue.add('import', { users });
    importStatus[job.id!] = { status: 'queued', progress: 0, total: users.length, results: [] };
    return { taskId: job.id };
  }

  getImportStatus(taskId: string) {
    return importStatus[taskId] || { status: 'not_found' };
  }
}

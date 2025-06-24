import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: undefined, // Используем память для обработки
    fileFilter: (req, file, cb) => {
      // Проверяем тип файла
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Можно загружать только изображения'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    },
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    try {
      // Создаем уникальное имя файла
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.originalname);
      const fileName = `avatar_${timestamp}_${randomString}${fileExtension}`;
      
      // Путь для сохранения файла (backend/uploads)
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const uploadPath = path.join(uploadsDir, fileName);
      
      // Сохраняем файл
      fs.writeFileSync(uploadPath, file.buffer);
      
      // Возвращаем URL для доступа к файлу
      const fileUrl = `http://localhost:3000/uploads/${fileName}`;
      
      console.log('File uploaded successfully:', {
        originalName: file.originalname,
        fileName,
        fileUrl,
        size: file.size
      });

      return {
        url: fileUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new BadRequestException('Ошибка при сохранении файла');
    }
  }
}

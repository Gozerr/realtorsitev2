import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

function avatarFileName(
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) {
  const ext = path.extname(file.originalname);
  const base = path.basename(file.originalname, ext);
  let fileName = file.originalname;
  const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
  if (fs.existsSync(path.join(avatarsDir, fileName))) {
    fileName = `${base}_${Date.now()}${ext}`;
  }
  cb(null, fileName);
}

@Controller('upload')
export class UploadController {
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const avatarsPath = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(avatarsPath)) {
          fs.mkdirSync(avatarsPath, { recursive: true });
        }
        cb(null, avatarsPath);
      },
      filename: avatarFileName,
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Генерация миниатюры
    const thumbnailsDir = path.join(__dirname, '..', 'uploads', 'avatars', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }
    const thumbPath = path.join(thumbnailsDir, file.filename);
    await sharp(file.path)
      .resize({ width: 300 })
      .toFile(thumbPath);
    // Возвращаем относительный путь для фронта
    return {
      url: `/uploads/avatars/${file.filename}`,
      thumbnail: `/uploads/avatars/thumbnails/${file.filename}`,
      fileName: file.filename,
    };
  }

  @Post('file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const unique = `${base}_${Date.now()}${ext}`;
        cb(null, unique);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      url: `/uploads/${file.filename}`,
      fileName: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
} 
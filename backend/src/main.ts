import * as dotenv from 'dotenv';
dotenv.config();

// Polyfill for crypto.randomUUID() in Node.js 18
if (!global.crypto) {
  const crypto = require('crypto');
  global.crypto = crypto;
}

console.log('=== BACKEND STARTED ===');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Agency } from './agencies/agency.entity';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { rateLimit } from 'express-rate-limit';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import * as cookieParser from 'cookie-parser';
import { AppDataSource } from './data-source';

async function bootstrap() {
  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, trace }) => {
            return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  const configService = app.get(ConfigService);
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Rate limiting
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10);
  app.use(
    rateLimit({
      windowMs,
      max,
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      // Добавь сюда свой production-домен, например:
      // 'https://your-production-domain.com',
    ],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Real Estate API')
    .setDescription('API для системы управления недвижимостью')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Аутентификация')
    .addTag('properties', 'Недвижимость')
    .addTag('users', 'Пользователи')
    .addTag('clients', 'Клиенты')
    .addTag('calendar', 'Календарь')
    .addTag('notifications', 'Уведомления')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    maxAge: '30d',
  });

  // Compression
  app.use(compression());

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // --- Получение или создание агентства ---
  const agenciesRepository = app.get(getRepositoryToken(Agency));
  let agency = await agenciesRepository.findOne({ where: {} });
  if (!agency) {
    agency = await agenciesRepository.save({ name: 'Default Agency' });
    logger.log('Default agency created with id: ' + agency.id);
  }

  // --- Создание суперпользователя ---
  const usersService = app.get(UsersService);
  const superuserEmail = configService.get('SUPERUSER_EMAIL') || 'superuser@example.com';
  const superuserPassword = configService.get('SUPERUSER_PASSWORD') || 'ChangeMe123!';
  
  const superuser = await usersService.findOneByEmail(superuserEmail);
  if (!superuser) {
    await usersService.create({
      email: superuserEmail,
      password: superuserPassword,
      firstName: 'Super',
      lastName: 'User',
      photo: 'https://olimp.vtcrm.ru/uploads/User_photos/phpXxFFcI.jpeg',
      role: UserRole.DIRECTOR,
      agencyId: agency.id
    });
    logger.log('Superuser created: ' + superuserEmail + ' / ' + superuserPassword);
  } else {
    logger.log('Superuser already exists: ' + superuserEmail);
  }

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/api/health`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

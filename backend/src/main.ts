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
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3001', // Указываем адрес нашего фронтенда
  });

  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api'); // Глобальный префикс для всех роутов

  // Настройка статических файлов для раздачи загруженных изображений
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(compression());

  // --- Получение или создание агентства ---
  const agenciesRepository = app.get(getRepositoryToken(Agency));
let agency = await agenciesRepository.findOne({ where: {} });
if (!agency) {
  agency = await agenciesRepository.save({ name: 'Default Agency' });
  console.log('Default agency created with id:', agency.id);
}

  // --- Создание суперпользователя ---
  const usersService = app.get(UsersService);
  const superuserEmail = 'superuser@example.com';
  const superuser = await usersService.findOneByEmail(superuserEmail);
  if (!superuser) {
    await usersService.create({
      email: superuserEmail,
      password: 'password',
      firstName: 'Super',
      lastName: 'User',
      photo: 'https://olimp.vtcrm.ru/uploads/User_photos/phpXxFFcI.jpeg', // Фото по умолчанию
      role: UserRole.DIRECTOR,
      agencyId: agency.id
    });
    console.log('Superuser created:', superuserEmail, '/ password');
  } else {
    console.log('Superuser already exists:', superuserEmail);
  }
  // ---

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

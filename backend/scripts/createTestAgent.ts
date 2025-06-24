import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { AgenciesService } from '../src/agencies/agencies.service';
import { UserRole } from '../src/users/user.entity';
import * as bcrypt from 'bcryptjs';

async function createTestAgent() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const agenciesService = app.get(AgenciesService);

    // Генерируем случайное имя
    const firstNames = ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Сергей', 'Елена', 'Андрей', 'Ольга', 'Михаил', 'Татьяна'];
    const lastNames = ['Иванов', 'Петрова', 'Сидоров', 'Козлова', 'Смирнов', 'Новикова', 'Попов', 'Морозова', 'Соколов', 'Волкова'];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    
    const testEmail = `test.agent.${randomNumber}@example.com`;
    const testPassword = 'qwerty123';

    console.log('🔍 Проверяем существующие агентства...');
    
    // Получаем первое доступное агентство или создаем новое
    let agencies = await agenciesService.findAll();
    let agencyId: number;

    if (agencies.length === 0) {
      console.log('📝 Создаем тестовое агентство...');
      const newAgency = await agenciesService.create({
        name: 'Тестовое агентство недвижимости'
      });
      agencyId = newAgency.id;
      console.log(`✅ Создано агентство: ${newAgency.name} (ID: ${agencyId})`);
    } else {
      agencyId = agencies[0].id;
      console.log(`✅ Используем существующее агентство: ${agencies[0].name} (ID: ${agencyId})`);
    }

    console.log('🔍 Проверяем, существует ли уже тестовый пользователь...');
    
    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await usersService.findOneByEmail(testEmail);
    if (existingUser) {
      console.log(`⚠️  Пользователь с email ${testEmail} уже существует`);
      console.log('📋 Данные существующего пользователя:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Имя: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Роль: ${existingUser.role}`);
      console.log(`   Агентство ID: ${existingUser.agency?.id}`);
      
      // Проверяем пароль
      const isPasswordCorrect = await bcrypt.compare(testPassword, existingUser.password);
      console.log(`   Пароль "qwerty123": ${isPasswordCorrect ? '✅ Корректный' : '❌ Неверный'}`);
      
      if (!isPasswordCorrect) {
        console.log('🔄 Обновляем пароль...');
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        await usersService['usersRepository'].update(existingUser.id, { password: hashedPassword });
        console.log('✅ Пароль обновлен');
      }
      
      return;
    }

    console.log('👤 Создаем тестового агента...');
    
    // Создаем тестового пользователя
    const newUser = await usersService.create({
      email: testEmail,
      password: testPassword,
      firstName: randomFirstName,
      lastName: randomLastName,
      role: UserRole.AGENT,
      agencyId: agencyId
    });

    console.log('✅ Тестовый агент успешно создан!');
    console.log('📋 Данные пользователя:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Имя: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Роль: ${newUser.role}`);
    console.log(`   Агентство ID: ${newUser.agency?.id}`);
    console.log('');
    console.log('🔑 Данные для входа:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Пароль: ${testPassword}`);
    console.log('');
    console.log('🚀 Теперь вы можете войти в систему с этими данными!');

  } catch (error) {
    console.error('❌ Ошибка при создании тестового агента:', error);
  } finally {
    await app.close();
  }
}

createTestAgent(); 
import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from '../src/data-source';
import { Property } from '../src/properties/property.entity';
import { User, UserRole } from '../src/users/user.entity';

async function batchAssignAgents() {
  await AppDataSource.initialize();
  const propRepo = AppDataSource.getRepository(Property);
  const userRepo = AppDataSource.getRepository(User);

  // Получаем всех агентов, включая superuser
  const agents = await userRepo.find({ where: { role: UserRole.AGENT } });
  if (agents.length < 2) {
    console.log('Недостаточно агентов для распределения!');
    await AppDataSource.destroy();
    return;
  }

  // Снимаем всех агентов с объектов
  await propRepo.createQueryBuilder()
    .update(Property)
    .set({ agent: null })
    .execute();

  // Получаем все объекты
  const allProps = await propRepo.find();
  let updated = 0;
  for (const prop of allProps) {
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    prop.agent = randomAgent;
    await propRepo.save(prop);
    updated++;
    console.log(`Объект ${prop.title || prop.address} привязан к агенту ${prop.agent.firstName} ${prop.agent.lastName}`);
  }
  await AppDataSource.destroy();
  console.log(`Массовая привязка завершена! Обновлено: ${updated}`);
}

batchAssignAgents().catch(console.error); 
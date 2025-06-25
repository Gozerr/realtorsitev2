import { DataSource } from 'typeorm';
import { Property } from '../src/properties/property.entity';
import { User, UserRole } from '../src/users/user.entity';
import { Agency } from '../src/agencies/agency.entity';
import { Client } from '../src/clients/client.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: [Property, User, Agency, Client],
  synchronize: false,
});

async function batchAssignAgents() {
  await AppDataSource.initialize();
  const propRepo = AppDataSource.getRepository(Property);
  const userRepo = AppDataSource.getRepository(User);

  const agents = await userRepo.find({ where: { role: UserRole.AGENT } });
  if (!agents.length) {
    console.log('Нет агентов для привязки!');
    await AppDataSource.destroy();
    return;
  }

  const allProps = await propRepo.find({ relations: ['agent'] });
  let i = 0;
  let updated = 0;
  for (const prop of allProps) {
    if (!prop.agent) {
      prop.agent = agents[i % agents.length];
      await propRepo.save(prop);
      i++;
      updated++;
      console.log(`Объект ${prop.title || prop.address} привязан к агенту ${prop.agent.firstName} ${prop.agent.lastName}`);
    }
  }
  await AppDataSource.destroy();
  console.log(`Массовая привязка завершена! Обновлено: ${updated}`);
}

batchAssignAgents().catch(console.error); 
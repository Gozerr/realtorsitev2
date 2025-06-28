import { AppDataSource } from '../src/data-source';
import { Property } from '../src/properties/property.entity';
import { User, UserRole } from '../src/users/user.entity';
import { IsNull } from 'typeorm';

const AGENT_ID = process.env.AGENT_ID ? Number(process.env.AGENT_ID) : undefined;

async function fixOrphanedProperties() {
  const ds = await AppDataSource.initialize();
  const propertyRepo = ds.getRepository(Property);
  const userRepo = ds.getRepository(User);

  let agent: User | null = null;
  if (AGENT_ID) {
    agent = await userRepo.findOneBy({ id: AGENT_ID });
  } else {
    agent = await userRepo.findOneBy({ role: UserRole.AGENT });
  }
  if (!agent) {
    console.error('Агент для назначения не найден!');
    process.exit(1);
  }

  const orphaned = await propertyRepo.find({ where: { agent: IsNull() } });
  if (orphaned.length === 0) {
    console.log('Нет объектов без агента.');
    process.exit(0);
  }
  for (const prop of orphaned) {
    prop.agent = agent;
    await propertyRepo.save(prop);
    console.log(`Объект id=${prop.id} теперь назначен агенту id=${agent.id}`);
  }
  console.log('Готово!');
  process.exit(0);
}

fixOrphanedProperties().catch(e => { console.error(e); process.exit(1); }); 
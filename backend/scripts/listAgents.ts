import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/user.entity';
import { Agency } from '../src/agencies/agency.entity';
import { Client } from '../src/clients/client.entity';
import { Property } from '../src/properties/property.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Agency, Client, Property],
  synchronize: false,
});

(async () => {
  await AppDataSource.initialize();
  const users = await AppDataSource.getRepository(User).find({ where: { role: UserRole.AGENT } });
  users.forEach(u => {
    console.log(`${u.email} | qwerty123 | ${u.firstName} ${u.lastName}`);
  });
  await AppDataSource.destroy();
})(); 
import 'reflect-metadata';
import { DataSource } from 'typeorm';

const isTs = __filename.endsWith('.ts');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: isTs
    ? ['src/**/*.entity.ts']
    : ['dist/**/*.entity.js'],
  migrations: isTs
    ? ['src/migrations/*.ts']
    : ['dist/migrations/*.js'],
  synchronize: false,
}); 
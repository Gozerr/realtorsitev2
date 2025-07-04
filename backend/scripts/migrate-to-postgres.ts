import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/data-source';
import { Property } from '../src/properties/property.entity';
import { Selection } from '../src/selections/selection.entity';
import * as fs from 'fs';

// SQLite конфигурация для чтения данных
const sqliteDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: [],
  synchronize: false,
});

// Карта: таблица -> список полей и их типов
const tableFields: Record<string, { name: string, type: 'json' | 'array' | 'date' | 'number' | 'string' | 'fk' }[]> = {
  property: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'address', type: 'string' },
    { name: 'price', type: 'number' },
    { name: 'area', type: 'number' },
    { name: 'bedrooms', type: 'number' },
    { name: 'bathrooms', type: 'number' },
    { name: 'status', type: 'string' },
    { name: 'isExclusive', type: 'number' },
    { name: 'photos', type: 'json' },
    { name: 'createdAt', type: 'date' },
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
    { name: 'agentId', type: 'fk' },
    { name: 'floor', type: 'number' },
    { name: 'totalFloors', type: 'number' },
    { name: 'link', type: 'string' },
    { name: 'pricePerM2', type: 'number' },
    { name: 'externalId', type: 'string' },
    { name: 'seller', type: 'string' },
    { name: 'datePublished', type: 'string' },
  ],
  message: [
    { name: 'content', type: 'string' },
    { name: 'createdAt', type: 'date' },
    { name: 'authorId', type: 'fk' },
    { name: 'conversationId', type: 'fk' },
    { name: 'status', type: 'string' },
  ],
  selections: [
    { name: 'title', type: 'string' },
    { name: 'propertyIds', type: 'array' },
    { name: 'createdAt', type: 'date' },
    { name: 'userId', type: 'fk' },
    { name: 'clientToken', type: 'string' },
    { name: 'clientLikes', type: 'json' },
  ],
  conversation: [
    { name: 'propertyId', type: 'fk' },
  ],
};

const entityMap = {
  property: Property,
  selections: Selection,
};

function transformRow(tableName: string, row: any): any {
  const newRow: any = {};
  const fields = tableFields[tableName];
  if (!fields) return row;
  for (const field of fields) {
    let value = row[field.name];
    if (field.type === 'json') {
      if (typeof value === 'string') {
        try { value = JSON.stringify(JSON.parse(value)); } catch { value = '[]'; }
      } else if (Array.isArray(value) || typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (value == null) {
        value = '[]';
      }
    }
    if (field.type === 'array') {
      if (Array.isArray(value)) value = value.join(',');
      else if (typeof value !== 'string') value = '';
    }
    if (field.type === 'date') {
      if (value) {
        const d = new Date(value);
        value = isNaN(d.getTime()) ? null : d.toISOString();
      } else value = null;
    }
    if (typeof value === 'undefined') value = null;
    newRow[field.name] = value;
  }
  return newRow;
}

function getInsertQuery(tableName: string, row: any): { query: string, values: any[] } {
  const fields = tableFields[tableName];
  if (!fields) return { query: '', values: [] };
  const columns = fields.map(f => f.name);
  const placeholders = fields.map(f => '?');
  const values = columns.map(col => row[col]);
  const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { query, values };
}

async function migrateData() {
  console.log('🚀 Начинаем миграцию данных из SQLite в PostgreSQL...');

  try {
    // Подключаемся к SQLite
    await sqliteDataSource.initialize();
    console.log('✅ Подключились к SQLite');

    // Подключаемся к PostgreSQL
    await AppDataSource.initialize();
    console.log('✅ Подключились к PostgreSQL');

    // Очищаем зависимые таблицы через QueryBuilder
    await AppDataSource.getRepository(Selection).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Property).createQueryBuilder().delete().execute();

    // Получаем все объекты из SQLite
    const sqliteRows = await sqliteDataSource.query('SELECT * FROM property');
    const seen = new Set();
    let imported = 0;
    for (const row of sqliteRows) {
      // Проверка на дубли по externalId или адресу
      const uniq = row.externalId || row.address;
      if (seen.has(uniq)) continue;
      seen.add(uniq);
      // photos: всегда массив строк
      if (typeof row.photos === 'string') {
        try {
          const arr = JSON.parse(row.photos);
          row.photos = Array.isArray(arr) ? arr : [];
        } catch {
          row.photos = [];
        }
      }
      if (!Array.isArray(row.photos)) row.photos = [];
      // createdAt: корректная дата или текущая
      if (!row.createdAt || isNaN(new Date(row.createdAt).getTime())) {
        row.createdAt = new Date();
      }
      // Удаляем id, чтобы не было конфликтов автоинкремента
      delete row.id;
      try {
        const entity = AppDataSource.getRepository(Property).create(row);
        await AppDataSource.getRepository(Property).save(entity);
        imported++;
      } catch (e) {
        console.log('⚠️ Ошибка при вставке property:', e.message);
      }
    }
    console.log(`✅ Импортировано ${imported} уникальных объектов недвижимости`);

    // Создаем таблицы в PostgreSQL
    await AppDataSource.synchronize();
    console.log('✅ Создали таблицы в PostgreSQL');

    const tables = Object.keys(entityMap);
    for (const tableName of tables) {
      const Entity = entityMap[tableName];
      const sqliteRows = await sqliteDataSource.query(`SELECT * FROM ${tableName}`);
      if (!sqliteRows.length) {
        console.log(`ℹ️ Таблица ${tableName} пуста`);
        continue;
      }
      console.log(`📊 Найдено ${sqliteRows.length} записей в таблице ${tableName}`);
      for (const row of sqliteRows) {
        try {
          // Удаляем id, чтобы не было конфликтов автоинкремента
          delete row.id;
          // Для conversation: если нет propertyId — пропускаем
          if (tableName === 'conversation' && (!row.propertyId || row.propertyId === null)) {
            console.log('⏭️ Пропущен conversation без propertyId');
            continue;
          }
          // Для дат: если некорректно — null
          for (const key in row) {
            if (key.toLowerCase().includes('date') && row[key]) {
              const d = new Date(row[key]);
              row[key] = isNaN(d.getTime()) ? null : d.toISOString();
            }
          }
          const entity = AppDataSource.getRepository(Entity).create(row);
          await AppDataSource.getRepository(Entity).save(entity);
        } catch (error) {
          console.log(`⚠️ Ошибка при вставке в ${tableName}:`, error.message);
        }
      }
      console.log(`✅ Мигрировано ${sqliteRows.length} записей из ${tableName}`);
    }

    console.log('🎉 Миграция завершена через TypeORM-entities!');

    await cleanupPropertiesToMirkvartirOnly();

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
  } finally {
    // Закрываем соединения
    if (sqliteDataSource.isInitialized) {
      await sqliteDataSource.destroy();
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function cleanupPropertiesToMirkvartirOnly() {
  const mirkvartirRaw = fs.readFileSync(__dirname + '/recent_objects_mirkvartir.json', 'utf-8');
  const mirkvartir = JSON.parse(mirkvartirRaw);
  const allowedIds = new Set(mirkvartir.map((obj: any) => obj.externalId));
  const repo = AppDataSource.getRepository(Property);
  const all = await repo.find();
  let removed = 0;
  for (const prop of all) {
    if (!allowedIds.has(prop.externalId)) {
      await repo.delete(prop.id);
      removed++;
    }
  }
  console.log(`✅ Оставлено только объекты Мир Квартир (${allowedIds.size}), удалено: ${removed}`);
}

// Запускаем миграцию
migrateData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); }); 
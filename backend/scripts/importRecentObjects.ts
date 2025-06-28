import { DataSource } from 'typeorm';
import { Property } from '../src/properties/property.entity';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../src/users/user.entity';
import { Agency } from '../src/agencies/agency.entity';
import { Client } from '../src/clients/client.entity';
import axios from 'axios';

// Настройте DataSource как в вашем проекте
const AppDataSource = new DataSource({
  type: 'sqlite', // или ваш тип БД
  database: 'db.sqlite', // путь к вашей БД
  entities: [Property, User, Agency, Client],
  synchronize: false, // не меняйте структуру БД
});

// Задержка между запросами к геокодеру (чтобы не попасть под лимиты)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const { data } = await axios.get(url, { headers: { 'Accept-Language': 'ru' } });
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } else {
      console.warn(`Координаты не найдены для адреса: ${address}`);
    }
  } catch (e) {
    console.error('Ошибка геокодирования:', e);
  }
  return null;
}

async function importRecentObjects() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Property);
  const userRepo = AppDataSource.getRepository(User);

  const filePath = path.join(__dirname, 'recent_objects_mirkvartir.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  const objects = JSON.parse(data);

  for (const obj of objects) {
    // --- Новый способ: ищем пользователя по email ---
    let agent: User | null = null;
    if (obj.agentEmail) {
      agent = await userRepo.findOneBy({ email: obj.agentEmail });
      if (!agent) {
        console.warn(`Пользователь с email ${obj.agentEmail} не найден, объект пропущен: ${obj.title}`);
        continue;
      }
    }

    // Проверяем, есть ли уже такой объект (например, по адресу и цене)
    const exists = await repo.findOneBy({ address: obj.address, price: obj.price });
    if (!exists) {
      // --- Геокодирование адреса ---
      let lat: number | undefined = undefined;
      let lng: number | undefined = undefined;
      if (obj.address) {
        const coords = await geocodeAddress(obj.address);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
        // Задержка между запросами к геокодеру (1 секунда)
        await delay(1000);
      }

      const property = repo.create({
        title: obj.title ?? 'Без названия',
        description: obj.description ?? '',
        address: obj.address ?? '',
        price: obj.price ?? 0,
        area: obj.area ?? 0,
        bedrooms: obj.rooms ?? 0,
        bathrooms: obj.bathrooms ?? 0,
        status: (obj.status as any) ?? 'for_sale',
        isExclusive: obj.isExclusive ?? false,
        photos: obj.images ?? [],
        createdAt: obj.datePublished ? new Date(obj.datePublished) : new Date(),
        agent: agent ?? null,
        lat,
        lng,
        floor: obj.floor ?? null,
        totalFloors: obj.totalFloors ?? null,
        link: obj.link ?? '',
      });
      await repo.save(property);
      console.log(`Импортирован объект: ${property.title || property.address} (${lat && lng ? 'с координатами' : 'без координат'}), агент: ${agent?.email}`);
    } else {
      // --- Обновляем только фото и ссылку ---
      let updated = false;
      if (Array.isArray(obj.images) && obj.images.length > 0 && JSON.stringify(obj.images) !== JSON.stringify(exists.photos)) {
        exists.photos = obj.images;
        updated = true;
      }
      if (obj.link && obj.link !== exists.link) {
        exists.link = obj.link;
        updated = true;
      }
      if (updated) {
        await repo.save(exists);
        console.log(`Обновлены фото/ссылка: ${exists.title || exists.address}`);
      } else {
        console.log(`Пропущен (уже есть, фото не изменились): ${obj.title || obj.address}`);
      }
    }
  }

  await AppDataSource.destroy();
  console.log('Импорт завершён!');
}

importRecentObjects().catch(console.error);
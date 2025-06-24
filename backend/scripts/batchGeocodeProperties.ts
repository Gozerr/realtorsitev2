import { DataSource, IsNull } from 'typeorm';
import { Property } from '../src/properties/property.entity';
import { User } from '../src/users/user.entity';
import { Agency } from '../src/agencies/agency.entity';
import { Client } from '../src/clients/client.entity';
import axios from 'axios';

const YANDEX_API_KEY = '835597f5-c393-40a9-b60e-b3d09b353675';

// Настройте DataSource как в вашем проекте
const AppDataSource = new DataSource({
  type: 'sqlite', // или ваш тип БД
  database: 'db.sqlite', // путь к вашей БД
  entities: [Property, User, Agency, Client],
  synchronize: false,
});

// Задержка между запросами к геокодеру (чтобы не попасть под лимиты)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция очистки адреса
function cleanAddress(address: string): string {
  return address
    .replace(/Россия/gi, '')
    .replace(/район/gi, '')
    .replace(/пос[её]лок/gi, '')
    .replace(/этаж[а-я0-9 ]*/gi, '')
    .replace(/квартира[а-я0-9 ]*/gi, '')
    .replace(/дом[а-я0-9 ]*/gi, '')
    .replace(/д[., ]/gi, '')
    .replace(/ул[., ]/gi, '')
    .replace(/улица/gi, '')
    .replace(/проезд/gi, '')
    .replace(/корпус/gi, '')
    .replace(/к[., ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Геокодирование через Nominatim
async function geocodeNominatim(address: string): Promise<{ lat: number, lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const { data } = await axios.get(url, { headers: { 'Accept-Language': 'ru' } });
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error('Ошибка геокодирования Nominatim:', e);
  }
  return null;
}

// Геокодирование через Яндекс
async function geocodeYandex(address: string): Promise<{ lat: number, lng: number } | null> {
  const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${YANDEX_API_KEY}&geocode=${encodeURIComponent(address)}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    const pos = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
    if (pos) {
      const [lng, lat] = pos.split(' ').map(Number);
      return { lat, lng };
    }
  } catch (e) {
    console.error('Ошибка геокодирования Яндекс:', e);
  }
  return null;
}

// Основная функция геокодирования с fallback
async function geocodeAddressVariants(address: string): Promise<{ lat: number, lng: number } | null> {
  const variants = [
    address,
    cleanAddress(address),
    address.split(',').slice(0, 2).join(',').trim()
  ];
  for (const variant of variants) {
    if (!variant) continue;
    // 1. Пробуем Nominatim
    const coordsNominatim = await geocodeNominatim(variant);
    if (coordsNominatim) {
      return coordsNominatim;
    } else {
      console.warn(`Nominatim не нашёл: "${variant}", пробуем Яндекс...`);
      await delay(500);
      // 2. Пробуем Яндекс
      const coordsYandex = await geocodeYandex(variant);
      if (coordsYandex) {
        return coordsYandex;
      } else {
        console.warn(`Яндекс не нашёл: "${variant}"`);
      }
    }
    await delay(500); // небольшая задержка между вариантами
  }
  return null;
}

async function batchGeocode() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Property);

  // Найти все объекты без координат (либо lat, либо lng null)
  const properties = await repo.find({
    where: [
      { lat: IsNull() },
      { lng: IsNull() }
    ]
  });

  let updated = 0;
  for (const property of properties) {
    if (property.address) {
      const coords = await geocodeAddressVariants(property.address);
      if (coords) {
        property.lat = coords.lat;
        property.lng = coords.lng;
        await repo.save(property);
        updated++;
        console.log(`Обновлены координаты для: ${property.title || property.address}`);
      } else {
        console.log(`Не удалось получить координаты для: ${property.title || property.address}`);
      }
      await delay(1000); // задержка 1 секунда между объектами
    }
  }

  await AppDataSource.destroy();
  console.log(`Массовое обновление координат завершено! Обновлено: ${updated}`);
}

batchGeocode().catch(console.error);
import axios from 'axios';
import fs from 'fs';
// import path from 'path';

const REGION_CODE = 76; // Ярославская область
const CITY_NAME = 'г Ярославль';
const API_URL = `https://domrfopendata.ru/api/objects?regionCode=${REGION_CODE}`;
const OUTPUT_FILE = __dirname + '/novostroyki_yaroslavl.json';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 15000 });
      return response.data;
    } catch (error) {
      console.error(`Попытка ${attempt} не удалась:`, error.message || error);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
      } else {
        throw new Error('Не удалось получить данные с API после нескольких попыток.');
      }
    }
  }
}

async function main() {
  console.log('Запрашиваю список новостроек Ярославля с наш.дом.рф...');
  try {
    const data = await fetchWithRetry(API_URL);
    if (!data || !Array.isArray(data.data)) {
      throw new Error('Некорректный формат ответа API.');
    }
    const allObjects = data.data;
    const filtered = allObjects.filter((obj: any) => obj.settlement === CITY_NAME);
    const mapped = filtered.map((obj: any) => ({
      id: obj.id,
      name: obj.object_name,
      address: obj.address,
      developer: obj.developer_full_name,
      status: obj.building_ready, // готовность
      commissioning_year: obj.commissioning_year,
      commissioning_quarter: obj.commissioning_quarter,
      latitude: obj.latitude,
      longitude: obj.longitude,
      site: obj.site,
      permit_number: obj.permit_number,
      permit_date: obj.permit_date,
    }));
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapped, null, 2), 'utf-8');
    console.log(`Успешно сохранено ${mapped.length} новостроек в ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Ошибка при получении или сохранении данных:', err.message || err);
    process.exit(1);
  }
}

main(); 
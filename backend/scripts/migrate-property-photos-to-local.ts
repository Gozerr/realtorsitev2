import { AppDataSource } from '../src/data-source';
import { Property } from '../src/properties/property.entity';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as sharp from 'sharp';

const uploadsDir = path.join(__dirname, '..', 'uploads', 'objects');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function getFileNameFromUrl(url: string, idx: number) {
  const ext = path.extname(url.split('?')[0]) || '.jpg';
  const base = path.basename(url.split('?')[0], ext);
  return `${base}_${idx}${ext}`;
}

async function downloadImage(url: string, dest: string): Promise<void> {
  const writer = fs.createWriteStream(dest);
  const response = await axios.get(url, { responseType: 'stream', timeout: 20000 });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });
}

async function migratePhotos() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Property);
  const properties = await repo.find();

  for (const property of properties) {
    if (!Array.isArray(property.photos) || property.photos.length === 0) continue;
    let changed = false;
    const newPhotos: string[] = [];
    for (let i = 0; i < property.photos.length; i++) {
      const url = property.photos[i];
      if (!url || !isExternalUrl(url)) {
        newPhotos.push(url);
        continue;
      }
      const fileName = getFileNameFromUrl(url, i);
      const localPath = path.join(uploadsDir, fileName);
      const thumbPath = path.join(thumbnailsDir, fileName);
      const relLocal = `/uploads/objects/${fileName}`;
      // Скачиваем, если файла нет
      if (!fs.existsSync(localPath)) {
        try {
          console.log(`Скачиваю: ${url}`);
          await downloadImage(url, localPath);
        } catch (e) {
          console.error(`Ошибка скачивания ${url}:`, e);
          continue;
        }
      }
      // Генерируем миниатюру, если нет
      if (!fs.existsSync(thumbPath)) {
        try {
          await sharp(localPath).resize({ width: 300 }).toFile(thumbPath);
        } catch (e) {
          console.error(`Ошибка генерации миниатюры для ${localPath}:`, e);
        }
      }
      newPhotos.push(relLocal);
      changed = true;
    }
    if (changed) {
      property.photos = newPhotos;
      await repo.save(property);
      console.log(`Обновлены фото для объекта: ${property.title || property.address}`);
    }
  }
  await AppDataSource.destroy();
  console.log('Миграция фото завершена!');
}

migratePhotos().catch(console.error); 
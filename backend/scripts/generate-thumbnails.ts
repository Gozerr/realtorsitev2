import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

const uploadsDir = path.join(__dirname, '..', 'uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir);
}

const files = fs.readdirSync(uploadsDir).filter(
  (file) =>
    file !== 'thumbnails' &&
    !file.startsWith('.') &&
    !fs.statSync(path.join(uploadsDir, file)).isDirectory() &&
    /\.(jpg|jpeg|png|webp)$/i.test(file)
);

(async () => {
  for (const file of files) {
    const thumbPath = path.join(thumbnailsDir, file);
    if (fs.existsSync(thumbPath)) {
      console.log(`Миниатюра уже есть: ${file}`);
      continue;
    }
    try {
      await sharp(path.join(uploadsDir, file))
        .resize({ width: 300 })
        .toFile(thumbPath);
      console.log(`Создана миниатюра: ${file}`);
    } catch (err) {
      console.error(`Ошибка для файла ${file}:`, err);
    }
  }
  console.log('Готово!');
})(); 
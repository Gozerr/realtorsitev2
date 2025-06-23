const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const BASE_URL = 'https://yargr.ru';

async function fetchPage(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return cheerio.load(data);
}

async function fetchObjectImages(objectUrl) {
  try {
    const $ = await fetchPage(objectUrl);
    // Собираем все фото из галереи (может быть другой селектор, если галерея реализована иначе)
    const images = [];
    $('.object_gallery img, .img_block img').each((i, el) => {
      let src = $(el).attr('src');
      if (src && !src.startsWith('http')) src = BASE_URL + src;
      if (src && !images.includes(src)) images.push(src);
    });
    // Если не нашли, fallback на основное фото
    if (images.length === 0) {
      const mainImg = $('.img_block img').attr('src');
      if (mainImg) images.push(mainImg.startsWith('http') ? mainImg : BASE_URL + mainImg);
    }
    return images;
  } catch (e) {
    return [];
  }
}

async function parseObjects() {
  const $ = await fetchPage(`${BASE_URL}/objects/`);
  const objects = [];

  $('.oblock.obj1').each((i, el) => {
    const block = $(el);
    const nameA = block.find('.info .name');
    const link = BASE_URL + nameA.attr('href');
    const idMatch = link.match(/object\/(\d+)\//);
    const id = idMatch ? idMatch[1] : null;
    const title = nameA.text().replace(/\\s+/g, ' ').trim();
    const address = block.find('.adres').text().replace(/\\s+/g, ' ').trim();
    const price = parseInt(block.find('.urovn b').text().replace(/\\D/g, ''), 10);
    const pricePerM2 = parseInt(block.find('.price_m2').text().replace(/\\D/g, ''), 10) || null;
    const description = block.find('.description').text().replace(/\\s+/g, ' ').trim();
    const mainImg = block.find('.img_block img').attr('src');
    const image = mainImg ? (mainImg.startsWith('http') ? mainImg : BASE_URL + mainImg) : null;
    const date = block.find('.ur .code').text().trim();
    const agency = block.find('.user_info.ag a').text().trim();

    // Дополнительные параметры
    const params = {};
    block.find('.dop_options_fon .option').each((i, opt) => {
      const key = $(opt).find('.name').text().replace(/[:\\s]+/g, '').replace(/\\u00a0/g, ' ').trim();
      const value = $(opt).find('.value').text().replace(/\\s+/g, ' ').trim();
      if (key) params[key] = value;
    });

    objects.push({
      id,
      title,
      address,
      price,
      pricePerM2,
      description,
      image,
      images: [], // заполним позже
      params,
      date,
      agency,
      link,
    });
  });

  // Парсим все фото с детальных страниц (асинхронно)
  for (let obj of objects) {
    obj.images = await fetchObjectImages(obj.link);
    // fallback: если images пустой, добавляем основное фото
    if (obj.images.length === 0 && obj.image) obj.images = [obj.image];
    // задержка между запросами, чтобы не спамить сайт
    await new Promise(r => setTimeout(r, 500));
    console.log(`Parsed: ${obj.title}`);
  }

  // Сохраняем результат
  await fs.writeFile('recent_objects.json', JSON.stringify(objects, null, 2), 'utf8');
  console.log('Done! Saved to recent_objects.json');
}

parseObjects();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://yargr.ru/objects/';
const OUTPUT_PATH = path.join(__dirname, 'recent_objects.json');

async function fetchPage(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return cheerio.load(data);
}

function parseArea(areaStr) {
  // Пример: "42/0/0 " или "375.6 " или "50/0/0 "
  if (!areaStr) return null;
  const match = areaStr.match(/\d+[\.,]?\d*/);
  return match ? parseFloat(match[0].replace(',', '.')) : null;
}

async function parseObjects() {
  let objects = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const url = `${BASE_URL}?PAGEN_1=${page}`;
    console.log(`Парсим страницу: ${url}`);
    const $ = await fetchPage(url);

    const html = $.html();
    fs.writeFileSync(path.join(__dirname, 'debug.html'), html, 'utf-8');
    console.log('Сохранил debug.html для анализа');
    

    const cards = $('.oblock.obj1');
    if (cards.length === 0) break;

    cards.each((_, el) => {
      const $el = $(el);

      // Картинка
      const img = $el.find('.img_block img').attr('src');
      // Название и ссылка
      const $name = $el.find('.info .name');
      const title = $name.text().trim();
      const link = $name.attr('href');
      // Адрес
      const address = $el.find('.info .adres').text().trim();
      // Цена
      const price = $el.find('.info .urovn b').text().replace(/\D/g, '');
      // Описание
      const description = $el.find('.info .description').text().trim();
      // Площадь
      let area = null;
      $el.find('.dop_options_fon .option').each((_, opt) => {
        const name = $(opt).find('.name').text();
        if (name && name.includes('Площадь')) {
          area = parseArea($(opt).find('.value').text());
        }
      });
      // Этаж
      let floor = null, totalFloors = null;
      $el.find('.dop_options_fon .option').each((_, opt) => {
        const name = $(opt).find('.name').text();
        if (name && name.includes('Этаж')) {
          const val = $(opt).find('.value').text().match(/(\\d+) из (\\d+)/);
          if (val) {
            floor = parseInt(val[1]);
            totalFloors = parseInt(val[2]);
          }
        }
      });
      // Агентство
      const agency = $el.find('.ur .user_info.ag a').text().trim();
      // Дата публикации
      const datePublished = $el.find('.ur .code').text().trim();

      objects.push({
        title,
        address,
        price: Number(price),
        area,
        floor,
        totalFloors,
        images: img ? [img.startsWith('http') ? img : `https://yargr.ru${img}`] : [],
        link: link ? (link.startsWith('http') ? link : `https://yargr.ru${link}`) : '',
        description,
        agency,
        datePublished,
        status: 'for_sale'
      });
    });

    // Проверяем, есть ли следующая страница
    hasNext = $('.pagination__next').length > 0;
    page++;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(objects, null, 2), 'utf-8');
  console.log(`Сохранено объектов: ${objects.length}`);
}

parseObjects().catch(console.error);
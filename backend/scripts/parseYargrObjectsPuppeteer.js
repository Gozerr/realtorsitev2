const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://yargr.ru/objects/';
const OUTPUT_PATH = path.join(__dirname, 'recent_objects.json');

function parseArea(areaStr) {
  if (!areaStr) return null;
  const match = areaStr.match(/\d+[\.,]?\d*/);
  return match ? parseFloat(match[0].replace(',', '.')) : null;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  let objects = [];
  let pageNum = 1;

  while (true) {
    const url = `${BASE_URL}?PAGEN_1=${pageNum}`;
    console.log(`Парсим страницу: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    const html = await page.content();

    // Сохраняем для анализа первую страницу
    if (pageNum === 1) {
      fs.writeFileSync(path.join(__dirname, 'debug_puppeteer.html'), html, 'utf-8');
      console.log('Сохранил debug_puppeteer.html для анализа');
    }

    const $ = cheerio.load(html);
    const cards = $('.oblock.obj1');
    if (cards.length === 0) break;

    cards.each((_, el) => {
      const $el = $(el);
      const img = $el.find('.img_block img').attr('src');
      const $name = $el.find('.info .name');
      const title = $name.text().trim();
      const link = $name.attr('href');
      const address = $el.find('.info .adres').text().trim();
      const price = $el.find('.info .urovn b').text().replace(/\D/g, '');
      const description = $el.find('.info .description').text().trim();
      let area = null;
      $el.find('.dop_options_fon .option').each((_, opt) => {
        const name = $(opt).find('.name').text();
        if (name && name.includes('Площадь')) {
          area = parseArea($(opt).find('.value').text());
        }
      });
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
      const agency = $el.find('.ur .user_info.ag a').text().trim();
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
    const hasNext = $('.pagination__next').length > 0;
    if (!hasNext) break;
    pageNum++;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(objects, null, 2), 'utf-8');
  console.log(`Сохранено объектов: ${objects.length}`);
  await browser.close();
})();
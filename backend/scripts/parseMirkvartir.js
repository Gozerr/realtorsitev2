const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit').default;

const BASE_URL = 'https://www.mirkvartir.ru/Ярославская+область/Ярославль/';
const OUTPUT_PATH = path.join(__dirname, 'recent_objects_mirkvartir.json');

async function fetchPage(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return cheerio.load(data);
}

function parseTitle(title) {
  // Пример: "3-комн., 78.8 м², 3/3 этаж"
  const match = title.match(/(\d+)-комн\.,\s*([\d.]+)\s*м²,\s*(\d+)\/(\d+)\s*этаж/);
  if (match) {
    return {
      rooms: parseInt(match[1], 10),
      area: parseFloat(match[2]),
      floor: parseInt(match[3], 10),
      totalFloors: parseInt(match[4], 10),
    };
  }
  return {};
}

async function fetchImagesFromDetail(link, debugIdx) {
  if (!link) return [];
  try {
    const $ = await fetchPage(link);
    if (debugIdx === 0) {
      // Сохраним html первой детальной страницы для отладки
      require('fs').writeFileSync('scripts/debug_detail.html', $.html(), 'utf-8');
    }
    let images = [];
    // Собираем все <img> из .gallery-slider и .gallery-carousel
    $('.gallery-slider img, .gallery-carousel img').each((_, img) => {
      const src = $(img).attr('data-src') || $(img).attr('src');
      if (src) images.push(src.startsWith('http') ? src : 'https:' + src);
    });
    images = Array.from(new Set(images));
    return images;
  } catch (e) {
    console.error('Ошибка при парсинге фото с детальной страницы', link, e.message);
    return [];
  }
}

async function parseObjects() {
  let objects = [];
  let page = 1;
  let hasNext = true;

  // Для распределения между двумя пользователями
  const agentEmails = [
    'test.agent.176@example.com',
    'superuser@example.com',
  ];
  let agentIdx = 0;

  // Пока парсим только первую страницу (можно расширить)
  const url = BASE_URL;
  console.log(`Парсим страницу: ${url}`);
  const $ = await fetchPage(url);

  const cards = $('.OffersListItem_bOffersListItem__Q0htF');
  if (cards.length === 0) {
    console.log('Нет объектов для парсинга!');
    return;
  }

  // Ограничим параллелизм, чтобы не спамить сайт
  const limit = pLimit(3);
  const tasks = [];

  cards.each((idx, el) => {
    const $el = $(el);
    const id = $el.find('.OffersListItem_overlabel__3pfEH').text().replace('№\u00A0', '').trim();
    const title = $el.find('.OffersListItem_offerTitle__3GQ_0 span').text().trim();
    const price = $el.find('.OfferPrice_price__1jdEj span').first().text().replace(/\D/g, '');
    const pricePerM2 = $el.find('.OfferPrice_priceSub__2BKUo span').first().text().replace(/\D/g, '');
    const address = $el.find('.OfferAddress_address__2O-MU').text().replace(/\s+/g, ' ').trim();
    const description = $el.find('.OffersListItem_infoText__1jjI7 > div').text().trim();
    const seller = $el.find('.SellerInfo_name__3i1lz strong').text().trim();
    const link = $el.find('.OffersListItem_offerTitle__3GQ_0').attr('href');
    const fullLink = link ? (link.startsWith('http') ? link : `https://www.mirkvartir.ru${link}`) : '';
    const pubDate = $el.find('.OffersListItem_pubDate__2t_Yj').text().trim();

    // Парсим параметры из заголовка
    const { rooms, area, floor, totalFloors } = parseTitle(title);

    // Распределяем агентский email поочередно
    const agentEmail = agentEmails[agentIdx % agentEmails.length];
    agentIdx++;

    // Асинхронная задача для парсинга фото с детальной страницы
    console.log('Детальная страница:', fullLink);
    tasks.push(limit(async () => {
      const images = await fetchImagesFromDetail(fullLink, idx);
      objects.push({
        externalId: id,
        title,
        address,
        price: Number(price),
        pricePerM2: Number(pricePerM2),
        area,
        rooms,
        floor,
        totalFloors,
        images,
        link: fullLink,
        description,
        seller,
        datePublished: pubDate,
        status: 'for_sale',
        agentEmail,
      });
    }));
  });

  await Promise.all(tasks);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(objects, null, 2), 'utf-8');
  console.log(`Сохранено объектов: ${objects.length}`);
}

parseObjects().catch(console.error); 
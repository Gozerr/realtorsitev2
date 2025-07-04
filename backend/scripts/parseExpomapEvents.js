const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://expomap.ru';
const SEARCH_URL = BASE_URL + '/expo/search/?&q=недвижимости&sType=conf&fr=&to=&sort_by=date';
const API_URL = 'http://localhost:3001/education'; // ваш backend
const API_TOKEN = process.env.API_TOKEN || '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  } catch (e) {
    console.error('Ошибка при запросе', url, e.message);
    return null;
  }
}

function parseEventsFromPage($) {
  const events = [];
  $('.cl-item').each((i, el) => {
    const $el = $(el);
    const title = $el.find('.cli-title a').first().text().trim();
    const link = BASE_URL + $el.find('.cli-title a').first().attr('href');
    const description = $el.find('.cli-descr').text().trim();
    const img = BASE_URL + $el.find('.cli-pict img').attr('src');
    const place = $el.find('.cli-place').text().trim();
    const startDate = $el.find('meta[itemprop="startDate"]').attr('content');
    const endDate = $el.find('meta[itemprop="endDate"]').attr('content');
    events.push({ title, link, description, img, place, startDate, endDate });
  });
  return events;
}

async function parseAllPages() {
  let url = SEARCH_URL;
  let allEvents = [];
  while (url) {
    const html = await fetchPage(url);
    if (!html) {
      console.log('Пропускаю страницу из-за ошибки:', url);
      await sleep(1000); // задержка между запросами
      continue;
    }
    const $ = cheerio.load(html);
    allEvents = allEvents.concat(parseEventsFromPage($));
    // Пагинация
    const next = $('.pg-next:not(.disabled)').attr('href');
    url = next ? BASE_URL + next : null;
    await sleep(1000); // задержка между запросами
  }
  return allEvents;
}

async function saveEventToBackend(event) {
  try {
    await axios.post(API_URL, {
      title: event.title,
      description: event.description,
      date: event.startDate,
      type: 'event',
      isActive: true,
      link: event.link,
      img: event.img,
      place: event.place,
      endDate: event.endDate,
    }, {
      headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
    });
    console.log('Saved:', event.title);
  } catch (e) {
    if (e.response && e.response.status === 409) {
      console.log('Already exists:', event.title);
    } else {
      console.error('Error saving', event.title, e.message);
    }
  }
}

(async () => {
  const events = await parseAllPages();
  for (const ev of events) {
    await saveEventToBackend(ev);
  }
  console.log('Done.');
})(); 
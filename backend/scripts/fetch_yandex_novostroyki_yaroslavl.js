const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = 'https://yandex.ru/realty/kupit/kvartira/novostroyki?lr=16&from=tabbar&geoid=16';
const OUTPUT_FILE = __dirname + '/yandex_novostroyki_kvartiry_yaroslavl.json';
const MAX_PAGES = 2; // Для демонстрации
const WAIT_TIMEOUT = 60000; // 60 секунд
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function scrape() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1280, height: 900 } });
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT });

  // Даем странице время на подгрузку динамики
  await new Promise(res => setTimeout(res, 5000));
  await page.screenshot({ path: __dirname + '/yandex_kvartiry_debug_page1.png', fullPage: true });

  let results = [];
  let currentPage = 1;

  while (currentPage <= MAX_PAGES) {
    console.log(`Собираю страницу ${currentPage}...`);
    await page.waitForSelector('article[data-testid="offer-card"]', { timeout: WAIT_TIMEOUT });
    const pageResults = await page.evaluate(() => {
      const cards = document.querySelectorAll('article[data-testid="offer-card"]');
      return Array.from(cards).map(card => {
        const name = card.querySelector('h3')?.innerText || '';
        const address = card.querySelector('[data-testid="offer-address"]')?.innerText || '';
        const price = card.querySelector('[data-testid="offer-price"]')?.innerText || '';
        const details = card.querySelector('.offer-card__params')?.innerText || '';
        const photo = card.querySelector('img')?.src || '';
        const link = card.querySelector('a')?.href || '';
        return { name, address, price, details, photo, link };
      });
    });
    console.log(`Найдено квартир на странице: ${pageResults.length}`);
    results = results.concat(pageResults);

    // Переход на следующую страницу
    const nextBtn = await page.$('a[aria-label="Следующая страница"], a[aria-label="Next page"]');
    if (nextBtn && currentPage < MAX_PAGES) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT }),
        nextBtn.click(),
      ]);
      currentPage++;
      await new Promise(res => setTimeout(res, 3000));
      await page.screenshot({ path: __dirname + `/yandex_kvartiry_debug_page${currentPage}.png`, fullPage: true });
    } else {
      break;
    }
  }

  await browser.close();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Готово! Собрано ${results.length} квартир, сохранено в ${OUTPUT_FILE}`);
}

scrape().catch(err => {
  console.error('Ошибка при парсинге:', err);
  process.exit(1);
}); 
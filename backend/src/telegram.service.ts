import axios from 'axios';

const TELEGRAM_BOT_TOKEN = '7887116584:AAEAwkMWa2UvWGQlVhJdc5HE1PEAjjMYeLA';
const API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export async function sendTelegramMessage(telegramId: string, text: string) {
  if (!telegramId) return;
  try {
    await axios.post(API_URL, {
      chat_id: telegramId,
      text,
    });
  } catch (err) {
    // Логируем ошибку подробно
    if (axios.isAxiosError(err)) {
      console.error('Ошибка отправки Telegram:', err.response?.data || err.message);
    } else {
      console.error('Неизвестная ошибка отправки Telegram:', err);
    }
  }
} 
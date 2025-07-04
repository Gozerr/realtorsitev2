import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('app.telegram.botToken') || '';
  }

  async sendTelegramMessage(telegramId: string, text: string): Promise<void> {
    if (!telegramId || !text) {
      this.logger.warn('Invalid telegramId or text provided');
      return;
    }

    if (!this.botToken) {
      this.logger.warn('Telegram bot token not configured');
      return;
    }

    try {
      const API_URL = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await axios.post(API_URL, {
        chat_id: telegramId,
        text,
        parse_mode: 'HTML',
      }, {
        timeout: 10000, // 10 second timeout
      });

      this.logger.log(`Telegram message sent to ${telegramId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Telegram API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        this.logger.error('Unknown Telegram error:', error);
      }
    }
  }

  async sendTelegramNotification(telegramId: string, title: string, message: string): Promise<void> {
    const formattedMessage = `🔔 <b>${title}</b>\n\n${message}`;
    await this.sendTelegramMessage(telegramId, formattedMessage);
  }
} 
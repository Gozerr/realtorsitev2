import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

// Mock axios
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramService', () => {
  let service: TelegramService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-bot-token'),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendTelegramMessage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should send telegram message successfully', async () => {
      const telegramId = '123456789';
      const text = 'Test message';

      mockedAxios.post.mockResolvedValue({ data: { ok: true } });

      await service.sendTelegramMessage(telegramId, text);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://api.telegram.org/bottest-bot-token/sendMessage`,
        {
          chat_id: telegramId,
          text,
          parse_mode: 'HTML',
        },
        {
          timeout: 10000,
        }
      );
    });

    it('should handle missing telegramId', async () => {
      const text = 'Test message';

      await service.sendTelegramMessage('', text);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle missing text', async () => {
      const telegramId = '123456789';

      await service.sendTelegramMessage(telegramId, '');

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle missing bot token', async () => {
      const telegramId = '123456789';
      const text = 'Test message';

      // Создаем новый экземпляр сервиса с пустым токеном для этого теста
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TelegramService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(''),
            },
          },
        ],
      }).compile();

      const serviceWithEmptyToken = module.get<TelegramService>(TelegramService);

      await serviceWithEmptyToken.sendTelegramMessage(telegramId, text);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle axios error', async () => {
      const telegramId = '123456789';
      const text = 'Test message';
      
      const axiosError = new Error('Network error');
      axiosError['isAxiosError'] = true;
      axiosError['response'] = {
        status: 400,
        data: { error_code: 400, description: 'Bad Request' },
      };
      mockedAxios.post.mockRejectedValue(axiosError);

      await service.sendTelegramMessage(telegramId, text);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should handle unknown error', async () => {
      const telegramId = '123456789';
      const text = 'Test message';

      mockedAxios.post.mockRejectedValue(new Error('Unknown error'));

      await service.sendTelegramMessage(telegramId, text);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('sendTelegramNotification', () => {
    it('should send formatted notification', async () => {
      const telegramId = '123456789';
      const title = 'Test Title';
      const message = 'Test Message';

      mockedAxios.post.mockResolvedValue({ data: { ok: true } });

      await service.sendTelegramNotification(telegramId, title, message);

      const expectedText = `🔔 <b>${title}</b>\n\n${message}`;
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://api.telegram.org/bottest-bot-token/sendMessage`,
        {
          chat_id: telegramId,
          text: expectedText,
          parse_mode: 'HTML',
        },
        {
          timeout: 10000,
        }
      );
    });
  });
}); 
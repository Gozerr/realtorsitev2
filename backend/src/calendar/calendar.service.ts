import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CalendarEvent } from './calendar-event.entity';
import { User } from '../users/user.entity';
import { TelegramService } from '../telegram.service';

// Функция для экранирования спецсимволов в HTML для Telegram
function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Функция для очистки HTML-сообщения для Telegram
function sanitizeTelegramHtml(str: string): string {
  if (!str) return '';
  // Не удаляем \n и \r, чтобы сохранить переносы строк в plain text
  // Удалить пробелы вокруг <br>
  str = str.replace(/\s*<br>\s*/g, '<br>');
  // Удалить двойные <br><br>
  str = str.replace(/(<br>)+/g, '<br>');
  // Удалить <br> в начале и конце
  str = str.replace(/^(<br>)+/, '').replace(/(<br>)+$/, '');
  // Удалить невидимые символы (кроме пробелов)
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
  return str;
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private calendarRepository: Repository<CalendarEvent>,
    private telegramService: TelegramService,
  ) {}

  // Получить все события для пользователя: личные + публичные
  async findAllForUser(user: User): Promise<CalendarEvent[]> {
    return this.calendarRepository.find({
      where: [
        { user: { id: user.id } },
        { type: 'public' },
      ],
      order: { start: 'ASC' },
    });
  }

  // Получить только личные события
  async findPersonal(user: User): Promise<CalendarEvent[]> {
    return this.calendarRepository.find({ where: { user: { id: user.id }, type: 'personal' }, order: { start: 'ASC' } });
  }

  // Получить только публичные события
  async findPublic(): Promise<CalendarEvent[]> {
    return this.calendarRepository.find({ where: { type: 'public' }, order: { start: 'ASC' } });
  }

  async findOneById(id: number, user: User): Promise<CalendarEvent | null> {
    return this.calendarRepository.findOne({
      where: [
        { id, user: { id: user.id } },
        { id, type: 'public' },
      ],
    });
  }

  async create(event: Partial<CalendarEvent>, user: User): Promise<CalendarEvent> {
    if ('userId' in event) delete event.userId;
    // Проверка на дубли: ищем событие с теми же title, type, start, end
    const where: any = {
      title: event.title,
      type: event.type,
      start: event.start,
    };
    if (event.end) {
      where.end = event.end;
    } else {
      where.end = IsNull();
    }
    const existing = await this.calendarRepository.findOne({ where });
    if (existing) {
      return existing;
    }
    const result = await this.calendarRepository
      .createQueryBuilder()
      .insert()
      .into(CalendarEvent)
      .values({ ...event, userId: user.id })
      .execute();
    const id = result.identifiers[0].id;
    const saved = await this.calendarRepository.findOne({ where: { id } });
    if (!saved) {
      throw new Error('Failed to create calendar event');
    }
    if (event.type === 'personal' && user.telegramId) {
      // Формируем информативное HTML-сообщение
      const startTime = event.start ? (event.start instanceof Date ? event.start : new Date(event.start)) : null;
      const endTime = event.end ? (event.end instanceof Date ? event.end : new Date(event.end)) : null;
      let msg = `Название: ${event.title || ''}`;
      if (event.description) msg += `\nОписание: ${event.description}`;
      if (startTime) {
        msg += `\nВремя: ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        if (endTime) msg += ` — ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      }
      msg = sanitizeTelegramHtml(msg);
      console.log('TELEGRAM MSG:', msg);
      await this.telegramService.sendTelegramMessage(user.telegramId, msg);
    }
    return saved!;
  }

  async update(id: number, event: Partial<CalendarEvent>, user: User): Promise<CalendarEvent | null> {
    const existing = await this.findOneById(id, user);
    if (!existing) return null;
    const oldStart = existing.start;
    const oldEnd = existing.end;
    Object.assign(existing, event);
    // Для личных событий user сохраняется, для публичных — null
    if (existing.type === 'personal') existing.user = user;
    if (existing.type === 'public') existing.user = null;
    const updated = await this.calendarRepository.save(existing);
    // Если изменилось время — отправить уведомление
    if (
      existing.type === 'personal' &&
      user.telegramId &&
      ((event.start && event.start !== oldStart) || (event.end && event.end !== oldEnd))
    ) {
      const startTime2 = existing.start ? (existing.start instanceof Date ? existing.start : new Date(existing.start)) : null;
      const endTime2 = existing.end ? (existing.end instanceof Date ? existing.end : new Date(existing.end)) : null;
      let msg = `Вы изменили время события: ${existing.title || ''}`;
      if (startTime2) {
        msg += `\nНовое время: ${startTime2.getHours().toString().padStart(2, '0')}:${startTime2.getMinutes().toString().padStart(2, '0')}`;
        if (endTime2) msg += ` — ${endTime2.getHours().toString().padStart(2, '0')}:${endTime2.getMinutes().toString().padStart(2, '0')}`;
      }
      msg = sanitizeTelegramHtml(msg);
      console.log('TELEGRAM MSG:', msg);
      await this.telegramService.sendTelegramMessage(user.telegramId, msg);
    }
    return updated;
  }

  async remove(id: number, user: User): Promise<boolean> {
    const existing = await this.findOneById(id, user);
    if (!existing) return false;
    await this.calendarRepository.remove(existing);
    return true;
  }
}
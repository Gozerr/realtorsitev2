import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent } from './calendar-event.entity';
import { User } from '../users/user.entity';
import { sendTelegramMessage } from '../telegram.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private calendarRepository: Repository<CalendarEvent>,
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
      console.log('Пробую отправить Telegram:', user.telegramId, event.title, event.start);
      await sendTelegramMessage(user.telegramId, `Напоминание: ${event.title}\n${event.start}`);
    }
    return saved!;
  }

  async update(id: number, event: Partial<CalendarEvent>, user: User): Promise<CalendarEvent | null> {
    const existing = await this.findOneById(id, user);
    if (!existing) return null;
    Object.assign(existing, event);
    // Для личных событий user сохраняется, для публичных — null
    if (existing.type === 'personal') existing.user = user;
    if (existing.type === 'public') existing.user = null;
    return this.calendarRepository.save(existing);
  }

  async remove(id: number, user: User): Promise<boolean> {
    const existing = await this.findOneById(id, user);
    if (!existing) return false;
    await this.calendarRepository.remove(existing);
    return true;
  }
} 
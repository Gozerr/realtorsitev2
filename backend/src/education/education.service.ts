import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationEvent } from './education-event.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EducationService {
  constructor(
    @InjectRepository(EducationEvent)
    private educationRepo: Repository<EducationEvent>,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(): Promise<EducationEvent[]> {
    return this.educationRepo.find({ order: { date: 'DESC' } });
  }

  async findOne(id: number): Promise<EducationEvent | null> {
    return this.educationRepo.findOne({ where: { id } });
  }

  async create(data: Partial<EducationEvent>): Promise<EducationEvent> {
    const event = this.educationRepo.create(data);
    const saved = await this.educationRepo.save(event);
    // Уведомление всем агентам (userId = 0 — broadcast, или реализовать рассылку по всем)
    await this.notificationsService.create({
      userId: 0,
      type: 'education',
      category: 'education',
      title: 'Новое обучающее событие',
      description: `Событие "${saved.title}" (${saved.type}) назначено на ${saved.date.toLocaleString('ru-RU')}`,
    });
    return saved;
  }

  async update(id: number, data: Partial<EducationEvent>): Promise<EducationEvent> {
    const event = await this.educationRepo.findOne({ where: { id } });
    if (!event) throw new Error('Событие не найдено');
    Object.assign(event, data);
    const saved = await this.educationRepo.save(event);
    await this.notificationsService.create({
      userId: 0,
      type: 'education',
      category: 'education',
      title: 'Обновлено обучающее событие',
      description: `Событие "${saved.title}" обновлено (${saved.type})`,
    });
    return saved;
  }

  async remove(id: number): Promise<void> {
    await this.educationRepo.delete(id);
  }
} 
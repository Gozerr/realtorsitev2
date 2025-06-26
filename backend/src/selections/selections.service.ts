import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Selection } from './selection.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SelectionsService {
  constructor(
    @InjectRepository(Selection)
    private selectionsRepository: Repository<Selection>,
  ) {}

  async findAllByUser(user: User): Promise<Selection[]> {
    return this.selectionsRepository.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
  }

  async findOneById(id: number, user: User): Promise<Selection | null> {
    return this.selectionsRepository.findOne({ where: { id, user: { id: user.id } } });
  }

  async create(title: string, propertyIds: number[], user: User): Promise<Selection> {
    const selection = this.selectionsRepository.create({ title, propertyIds, user });
    return this.selectionsRepository.save(selection);
  }

  async update(id: number, title: string, propertyIds: number[], user: User): Promise<Selection | null> {
    const selection = await this.findOneById(id, user);
    if (!selection) return null;
    selection.title = title;
    selection.propertyIds = propertyIds;
    return this.selectionsRepository.save(selection);
  }

  async remove(id: number, user: User): Promise<boolean> {
    const selection = await this.findOneById(id, user);
    if (!selection) return false;
    await this.selectionsRepository.remove(selection);
    return true;
  }
} 
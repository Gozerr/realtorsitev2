import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property, PropertyStatus } from './property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private notificationsService: NotificationsService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getStatistics() {
    const total = await this.propertiesRepository.count();
    const forSale = await this.propertiesRepository.count({
      where: { status: PropertyStatus.FOR_SALE },
    });
    const exclusives = await this.propertiesRepository.count({
      where: { isExclusive: true },
    });

    return { total, forSale, exclusives };
  }

  findAllRecent(): Promise<Property[]> {
    return this.propertiesRepository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: ['agent'],
    });
  }

  findOne(id: number): Promise<Property | null> {
    return this.propertiesRepository.findOne({
      where: { id },
      relations: ['agent'],
    });
  }

  findAllForAgent(agentId: number): Promise<Property[]> {
    return this.propertiesRepository.find({
      where: { agent: { id: agentId } },
    });
  }

  async create(createPropertyDto: CreatePropertyDto, agentId: number): Promise<Property> {
    const newProperty = this.propertiesRepository.create({
      ...createPropertyDto,
      agent: { id: agentId },
    });
    const saved = await this.propertiesRepository.save(newProperty);
    // Уведомление о создании объекта
    await this.notificationsService.create({
      userId: agentId,
      type: 'objects',
      category: 'property',
      title: 'Создан новый объект',
      description: `Объект "${saved.title}" успешно создан`,
    });
    return saved;
  }

  async update(propertyId: number, updateData: Partial<Property>, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Объект не найден');
    Object.assign(property, updateData);
    const saved = await this.propertiesRepository.save(property);
    await this.notificationsService.create({
      userId: property.agent?.id || userId,
      type: 'objects',
      category: 'property',
      title: 'Объект изменён',
      description: `Объект "${property.title}" был изменён`,
    });
    return saved;
  }

  async remove(propertyId: number, userId: number): Promise<void> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Объект не найден');
    await this.propertiesRepository.delete(propertyId);
    await this.notificationsService.create({
      userId: property.agent?.id || userId,
      type: 'objects',
      category: 'property',
      title: 'Объект удалён',
      description: `Объект "${property.title}" был удалён`,
    });
  }

  async archive(propertyId: number, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Объект не найден');
    property.status = PropertyStatus.SOLD;
    const saved = await this.propertiesRepository.save(property);
    await this.notificationsService.create({
      userId: property.agent?.id || userId,
      type: 'objects',
      category: 'property',
      title: 'Объект архивирован',
      description: `Объект "${property.title}" был перемещён в архив`,
    });
    return saved;
  }

  async restore(propertyId: number, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Объект не найден');
    property.status = PropertyStatus.FOR_SALE;
    const saved = await this.propertiesRepository.save(property);
    await this.notificationsService.create({
      userId: property.agent?.id || userId,
      type: 'objects',
      category: 'property',
      title: 'Объект восстановлен',
      description: `Объект "${property.title}" восстановлен из архива`,
    });
    return saved;
  }

  async setExclusive(propertyId: number, isExclusive: boolean, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Объект не найден');
    property.isExclusive = isExclusive;
    const saved = await this.propertiesRepository.save(property);
    await this.notificationsService.create({
      userId: property.agent?.id || userId,
      type: 'objects',
      category: 'property',
      title: isExclusive ? 'Эксклюзивность установлена' : 'Эксклюзивность снята',
      description: `Объект "${property.title}" теперь ${isExclusive ? 'эксклюзивный' : 'не эксклюзивный'}`,
    });
    return saved;
  }

  // Новый метод для получения всех фото всех объектов
  async getAllPhotos(): Promise<string[]> {
    const properties = await this.propertiesRepository.find();
    // Собираем все фото в один массив (убираем пустые и дубликаты)
    const allPhotos = properties
      .flatMap(p => p.photos || [])
      .filter(url => !!url);
    // Если хотите убрать дубликаты:
    // return Array.from(new Set(allPhotos));
    return allPhotos;
  }

  async updateStatus(propertyId: number, newStatus: PropertyStatus, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Объект не найден');
    const oldStatus = property.status;
    if (oldStatus === newStatus) return property;
    property.status = newStatus;
    const saved = await this.propertiesRepository.save(property);
    // Получаем всех агентов
    const agents = await this.userRepo.find({ where: { role: UserRole.AGENT } });
    const agentIds = agents.map(a => a.id);
    // Массовая рассылка всем агентам
    await this.notificationsService.create({
      userId: 0,
      type: 'objects',
      category: 'property',
      title: 'Статус объекта изменён',
      description: `Объект "${property.title}" теперь имеет статус: ${newStatus}`,
    });
    // Персонально инициатору, только если он не агент
    if (!agentIds.includes(userId)) {
      await this.notificationsService.create({
        userId,
        type: 'objects',
        category: 'property',
        title: 'Статус объекта изменён',
        description: `Объект "${property.title}" теперь имеет статус: ${newStatus}`,
      });
    }
    return saved;
  }

  // Поиск объектов по bbox (карта) с лимитом и пагинацией
  async findByBoundingBox(sw_lng: number, sw_lat: number, ne_lng: number, ne_lat: number, filters: any): Promise<any[]> {
    const qb = this.propertiesRepository.createQueryBuilder('property')
      .select([
        'property.id',
        'property.title',
        'property.price',
        'property.address',
        'property.photos',
        'property.lat',
        'property.lng',
        'property.status',
      ])
      .where('property.lat BETWEEN :sw_lat AND :ne_lat', { sw_lat, ne_lat })
      .andWhere('property.lng BETWEEN :sw_lng AND :ne_lng', { sw_lng, ne_lng });
    // Фильтры (пример: статус, цена)
    if (filters.status) {
      qb.andWhere('property.status = :status', { status: filters.status });
    }
    if (filters.minPrice) {
      qb.andWhere('property.price >= :minPrice', { minPrice: Number(filters.minPrice) });
    }
    if (filters.maxPrice) {
      qb.andWhere('property.price <= :maxPrice', { maxPrice: Number(filters.maxPrice) });
    }
    // Лимит и пагинация
    const limit = filters.limit ? Math.min(Number(filters.limit), 1000) : 200;
    const offset = filters.offset ? Number(filters.offset) : 0;
    qb.take(limit).skip(offset);
    const results = await qb.getMany();
    // Оставляем только первую фотографию
    return results.map(p => ({
      ...p,
      photos: Array.isArray(p.photos) && p.photos.length > 0 ? [p.photos[0]] : [],
    }));
  }

  async findAll(): Promise<Property[]> {
    return this.propertiesRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['agent'],
    });
  }
}
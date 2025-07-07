import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Property, PropertyStatus } from './property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/user.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { StatisticsService } from '../statistics.service';
import { StatsGateway } from '../statistics.gateway';

export interface PropertyFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  status?: PropertyStatus;
  isExclusive?: boolean;
  agentId?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);
  private readonly cache = new Map<string, any>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private notificationsService: NotificationsService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationsGateway: NotificationsGateway,
    private statisticsService: StatisticsService,
    private statsGateway: StatsGateway,
  ) {}

  private getCacheKey(key: string): string {
    return `property:${key}`;
  }

  private setCache(key: string, value: any): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
    });
  }

  private getCache(key: string): any | null {
    const cacheKey = this.getCacheKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.value;
  }

  async getStatistics() {
    const cacheKey = 'statistics';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const [total, forSale, exclusives] = await Promise.all([
        this.propertiesRepository.count(),
        this.propertiesRepository.count({
          where: { status: PropertyStatus.FOR_SALE },
        }),
        this.propertiesRepository.count({
          where: { isExclusive: true },
        }),
      ]);

      const stats = { total, forSale, exclusives };
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      this.logger.error('Error getting statistics:', error);
      throw new BadRequestException('Failed to get statistics');
    }
  }

  async findAllRecent(limit: number = 20): Promise<Property[]> {
    try {
      return await this.propertiesRepository.find({
        order: {
          createdAt: 'DESC',
        },
        relations: ['agent', 'agent.agency'],
        take: limit,
      });
    } catch (error) {
      this.logger.error('Error finding recent properties:', error);
      throw new BadRequestException('Failed to get recent properties');
    }
  }

  async findOne(id: number): Promise<Property> {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid property ID');
    }

    try {
      const property = await this.propertiesRepository.findOne({
        where: { id },
        relations: ['agent', 'agent.agency'],
      });

      if (!property) {
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      return property;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error finding property ${id}:`, error);
      throw new BadRequestException('Failed to get property');
    }
  }

  async findAllForAgent(agentId: number, options: PaginationOptions = {}): Promise<{ properties: Property[]; total: number }> {
    if (!agentId || agentId <= 0) {
      throw new BadRequestException('Invalid agent ID');
    }
    try {
      const [properties, total] = await this.propertiesRepository.findAndCount({
        where: { agent: { id: agentId } },
        relations: ['agent', 'agent.agency'],
        skip: options.page && options.limit ? (options.page - 1) * options.limit : 0,
        take: options.limit,
      });
      return { properties, total };
    } catch (error) {
      this.logger.error(`Error finding properties for agent ${agentId}:`, error);
      throw new BadRequestException('Failed to get properties for agent');
    }
  }

  async findAll(filters: PropertyFilters = {}, options: PaginationOptions = {}): Promise<{ properties: Property[]; total: number }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.propertiesRepository.createQueryBuilder('property')
        .leftJoinAndSelect('property.agent', 'agent')
        .leftJoinAndSelect('agent.agency', 'agency');

      // Apply filters
      if (filters.search) {
        queryBuilder.andWhere(
          '(property.title LIKE :search OR property.address LIKE :search OR property.description LIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters.minPrice !== undefined) {
        queryBuilder.andWhere('property.price >= :minPrice', { minPrice: filters.minPrice });
      }

      if (filters.maxPrice !== undefined) {
        queryBuilder.andWhere('property.price <= :maxPrice', { maxPrice: filters.maxPrice });
      }

      if (filters.minArea !== undefined) {
        queryBuilder.andWhere('property.area >= :minArea', { minArea: filters.minArea });
      }

      if (filters.maxArea !== undefined) {
        queryBuilder.andWhere('property.area <= :maxArea', { maxArea: filters.maxArea });
      }

      if (filters.status) {
        queryBuilder.andWhere('property.status = :status', { status: filters.status });
      }

      if (filters.isExclusive !== undefined) {
        queryBuilder.andWhere('property.isExclusive = :isExclusive', { isExclusive: filters.isExclusive });
      }

      if (filters.agentId) {
        queryBuilder.andWhere('property."agentId" = :agentId', { agentId: filters.agentId });
      }

      const [properties, total] = await queryBuilder
        .orderBy('property.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return { properties, total };
    } catch (error) {
      this.logger.error('Error finding properties with filters:', error);
      throw new BadRequestException('Failed to get properties');
    }
  }

  async create(createPropertyDto: CreatePropertyDto, agentId: number): Promise<Property> {
    if (!agentId || agentId <= 0) {
      throw new BadRequestException('Invalid agent ID');
    }

    try {
      const newProperty = this.propertiesRepository.create({
        ...createPropertyDto,
        agent: { id: agentId },
      });

      const saved = await this.propertiesRepository.save(newProperty);
      
      // Clear cache
      this.cache.clear();
      
      // Notification
      await this.notificationsService.create({
        userId: agentId,
        type: 'objects',
        category: 'property',
        title: 'Создан новый объект',
        description: `Объект "${saved.title}" успешно создан`,
      });

      this.logger.log(`Property created: ${saved.id} by agent ${agentId}`);

      const stats = await this.statisticsService.getStatistics();
      this.statsGateway.broadcast(stats);

      return saved;
    } catch (error) {
      this.logger.error('Error creating property:', error);
      throw new BadRequestException('Failed to create property');
    }
  }

  async update(propertyId: number, updateData: Partial<Property>, userId: number): Promise<Property> {
    if (!propertyId || propertyId <= 0) {
      throw new BadRequestException('Invalid property ID');
    }

    try {
      const property = await this.propertiesRepository.findOne({ 
        where: { id: propertyId }, 
        relations: ['agent', 'agent.agency'] 
      });
      
      if (!property) {
        throw new NotFoundException(`Property with ID ${propertyId} not found`);
      }

      Object.assign(property, updateData);
      const saved = await this.propertiesRepository.save(property);
      
      // Clear cache
      this.cache.clear();
      
      // Notification
      await this.notificationsService.create({
        userId: property.agent?.id || userId,
        type: 'objects',
        category: 'property',
        title: 'Объект изменён',
        description: `Объект "${property.title}" был изменён`,
      });

      this.logger.log(`Property updated: ${propertyId} by user ${userId}`);

      const stats = await this.statisticsService.getStatistics();
      this.statsGateway.broadcast(stats);

      return saved;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error updating property ${propertyId}:`, error);
      throw new BadRequestException('Failed to update property');
    }
  }

  async remove(propertyId: number, userId: number): Promise<void> {
    if (!propertyId || propertyId <= 0) {
      throw new BadRequestException('Invalid property ID');
    }

    try {
      const property = await this.propertiesRepository.findOne({ 
        where: { id: propertyId }, 
        relations: ['agent', 'agent.agency'] 
      });
      
      if (!property) {
        throw new NotFoundException(`Property with ID ${propertyId} not found`);
      }

      await this.propertiesRepository.delete(propertyId);
      
      // Clear cache
      this.cache.clear();
      
      // Notification
      await this.notificationsService.create({
        userId: property.agent?.id || userId,
        type: 'objects',
        category: 'property',
        title: 'Объект удалён',
        description: `Объект "${property.title}" был удалён`,
      });

      this.logger.log(`Property deleted: ${propertyId} by user ${userId}`);

      const stats = await this.statisticsService.getStatistics();
      this.statsGateway.broadcast(stats);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error deleting property ${propertyId}:`, error);
      throw new BadRequestException('Failed to delete property');
    }
  }

  async archive(propertyId: number, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent', 'agent.agency'] });
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

    const stats = await this.statisticsService.getStatistics();
    this.statsGateway.broadcast(stats);

    return saved;
  }

  async restore(propertyId: number, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent', 'agent.agency'] });
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

    const stats = await this.statisticsService.getStatistics();
    this.statsGateway.broadcast(stats);

    return saved;
  }

  async setExclusive(propertyId: number, isExclusive: boolean, userId: number): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent', 'agent.agency'] });
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

    const stats = await this.statisticsService.getStatistics();
    this.statsGateway.broadcast(stats);

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
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent', 'agent.agency'] });
    console.log('[updateStatus] property:', property);
    console.log('[updateStatus] property.agent:', property?.agent);
    console.log('[updateStatus] property.agent.id:', property?.agent?.id, typeof property?.agent?.id);
    console.log('[updateStatus] userId:', userId, typeof userId);
    if (!property) throw new Error('Объект не найден');
    if (!property.agent || property.agent.id !== userId) {
      throw new Error('Только закреплённый агент может менять статус объекта');
    }
    const oldStatus = property.status;
    if (oldStatus === newStatus) return property;
    property.status = newStatus;
    await this.propertiesRepository.save(property);
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
    // Вернуть актуальный объект с relations
    const updated = await this.propertiesRepository.findOne({ where: { id: propertyId }, relations: ['agent', 'agent.agency'] });
    if (!updated) throw new Error('Объект не найден после обновления');

    const stats = await this.statisticsService.getStatistics();
    this.statsGateway.broadcast(stats);

    return updated;
  }

  // Поиск объектов по bbox (карта) с лимитом и пагинацией
  async findByBoundingBox(
    sw_lng: number, 
    sw_lat: number, 
    ne_lng: number, 
    ne_lat: number, 
    filters: any = {},
    limit: number = 1000
  ): Promise<any[]> {
    try {
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
          'property.area',
          'property.bedrooms',
          'property.bathrooms',
        ])
        .where('property.lat BETWEEN :sw_lat AND :ne_lat', { sw_lat, ne_lat })
        .andWhere('property.lng BETWEEN :sw_lng AND :ne_lng', { sw_lng, ne_lng })
        .take(limit);

      // Apply additional filters
      if (filters.status) {
        qb.andWhere('property.status = :status', { status: filters.status });
      }

      if (filters.minPrice) {
        qb.andWhere('property.price >= :minPrice', { minPrice: filters.minPrice });
      }

      if (filters.maxPrice) {
        qb.andWhere('property.price <= :maxPrice', { maxPrice: filters.maxPrice });
      }

      return await qb.getRawMany();
    } catch (error) {
      this.logger.error('Error finding properties by bounding box:', error);
      throw new BadRequestException('Failed to get properties by location');
    }
  }

  async findOrphaned(): Promise<Property[]> {
    return this.propertiesRepository.find({ where: { agent: IsNull() } });
  }

  async findAllWithAgent(): Promise<Property[]> {
    return this.propertiesRepository.find({ relations: ['agent', 'agent.agency'] });
  }
}
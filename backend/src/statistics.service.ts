import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './properties/property.entity';
import { Client } from './clients/client.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async getStatistics() {
    const properties = await this.propertiesRepository.find({ relations: ['agent'] });
    const clients = await this.clientsRepository.find();
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const sold = properties.filter(p => ['sold', 'продан', 'продано'].includes((p.status || '').toLowerCase()));
    const forSale = properties.filter(p => (p.status || '').toLowerCase() === 'for_sale');
    const newThisMonth = properties.filter(p => typeof p.createdAt === 'string' && new Date(p.createdAt) > monthAgo).length;
    const maxSoldObj = sold.reduce<Property | null>(
      (max, p) => (Number(p.price) > Number(max?.price || 0) ? p : max),
      null
    );
    const clientsCount = clients.length;
    const newClientsMonth = clients.filter(c => typeof c.createdAt === 'string' && new Date(c.createdAt) > monthAgo).length;
    // Динамика продаж по месяцам
    const salesByMonth: Record<string, number> = {};
    sold.forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      salesByMonth[key] = (salesByMonth[key] || 0) + 1;
    });
    const months = Object.keys(salesByMonth).sort();
    const salesGrowth = months.length > 1 ? salesByMonth[months[months.length - 1]] - salesByMonth[months[months.length - 2]] : 0;
    return {
      soldCount: sold.length,
      maxSoldPrice: maxSoldObj?.price || 0,
      clientsCount,
      newClientsMonth,
      salesGrowth,
      newThisMonth,
      maxSoldObj,
      forSaleCount: forSale.length,
      totalCount: properties.length,
    };
  }
} 
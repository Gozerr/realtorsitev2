import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property, PropertyStatus } from './property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
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

  findAllForAgent(agentId: number): Promise<Property[]> {
    return this.propertiesRepository.find({
      where: { agent: { id: agentId } },
    });
  }

  create(createPropertyDto: CreatePropertyDto, agentId: number): Promise<Property> {
    const newProperty = this.propertiesRepository.create({
      ...createPropertyDto,
      agent: { id: agentId },
    });
    return this.propertiesRepository.save(newProperty);
  }
}

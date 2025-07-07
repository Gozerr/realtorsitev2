import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { StatisticsService } from '../statistics.service';
import { StatsGateway } from '../statistics.gateway';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private statisticsService: StatisticsService,
    private statsGateway: StatsGateway,
  ) {}

  findAllForAgent(agentId: number): Promise<Client[]> {
    return this.clientsRepository.find({
      where: { agent: { id: agentId } },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createClientDto: CreateClientDto, agentId: number): Promise<Client> {
    const newClient = this.clientsRepository.create({
      ...createClientDto,
      agent: { id: agentId },
    });
    const savedClient = await this.clientsRepository.save(newClient);
    const stats = await this.statisticsService.getStatistics();
    this.statsGateway.broadcast(stats);
    return savedClient;
  }
} 
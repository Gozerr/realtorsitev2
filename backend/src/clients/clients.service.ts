import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  findAllForAgent(agentId: number): Promise<Client[]> {
    return this.clientsRepository.find({
      where: { agent: { id: agentId } },
      order: { createdAt: 'DESC' },
    });
  }

  create(createClientDto: CreateClientDto, agentId: number): Promise<Client> {
    const newClient = this.clientsRepository.create({
      ...createClientDto,
      agent: { id: agentId },
    });
    return this.clientsRepository.save(newClient);
  }
} 
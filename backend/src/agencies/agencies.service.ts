import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from './agency.entity';
import { CreateAgencyDto } from './dto/create-agency.dto';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
  ) {}

  findAll(): Promise<Agency[]> {
    return this.agenciesRepository.find();
  }

  create(createAgencyDto: CreateAgencyDto): Promise<Agency> {
    const newAgency = this.agenciesRepository.create(createAgencyDto);
    return this.agenciesRepository.save(newAgency);
  }
}

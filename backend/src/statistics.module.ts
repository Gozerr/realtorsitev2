import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './properties/property.entity';
import { Client } from './clients/client.entity';
import { StatisticsService } from './statistics.service';
import { StatsGateway } from './statistics.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Property, Client])],
  providers: [StatisticsService, StatsGateway],
  exports: [StatisticsService, StatsGateway],
})
export class StatisticsModule {} 
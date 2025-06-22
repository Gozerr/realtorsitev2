import { Module } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { AgenciesController } from './agencies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from './agency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agency])],
  providers: [AgenciesService],
  controllers: [AgenciesController],
})
export class AgenciesModule {}

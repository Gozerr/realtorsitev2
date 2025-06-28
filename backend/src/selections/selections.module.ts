import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Selection } from './selection.entity';
import { SelectionsService } from './selections.service';
import { SelectionsController } from './selections.controller';
import { Property } from '../properties/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Selection, Property])],
  providers: [SelectionsService],
  controllers: [SelectionsController],
  exports: [SelectionsService],
})
export class SelectionsModule {} 
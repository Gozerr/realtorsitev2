import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Selection } from './selection.entity';
import { SelectionsService } from './selections.service';
import { SelectionsController } from './selections.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Selection])],
  providers: [SelectionsService],
  controllers: [SelectionsController],
  exports: [SelectionsService],
})
export class SelectionsModule {} 
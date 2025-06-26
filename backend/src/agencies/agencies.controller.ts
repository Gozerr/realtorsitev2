import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createAgencyDto: CreateAgencyDto) {
    return this.agenciesService.create(createAgencyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agenciesService.findOne(Number(id));
  }
}

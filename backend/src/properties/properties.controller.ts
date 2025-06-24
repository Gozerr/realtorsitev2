import { Controller, Get, Post, Body, UseGuards, Request, Param, NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('statistics')
  getStatistics() {
    return this.propertiesService.getStatistics();
  }

  @Get('recent')
  findAllRecent() {
    return this.propertiesService.findAllRecent();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const property = await this.propertiesService.findOne(+id);
    if (!property) {
      throw new NotFoundException('Объект недвижимости не найден');
    }
    return property;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllForAgent(@Request() req) {
    const agentId = req.user.userId;
    return this.propertiesService.findAllForAgent(agentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    const agentId = req.user.userId;
    return this.propertiesService.create(createPropertyDto, agentId);
  }

  // Новый эндпоинт для получения всех фото всех объектов
  @Get('all-photos')
  async getAllPhotos() {
    return this.propertiesService.getAllPhotos();
  }
}
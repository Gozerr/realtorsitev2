import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  NotFoundException,
  Patch,
  Query,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PropertyStatus } from './property.entity';

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
  async getProperties(@Query('agentId') agentId?: string) {
    if (agentId) {
      return this.propertiesService.findAllForAgent(Number(agentId));
    }
    return this.propertiesService.findAllRecent();
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: PropertyStatus }, @Request() req) {
    const userId = req.user.userId;
    return this.propertiesService.updateStatus(+id, body.status, userId);
  }

  // Новый эндпоинт для поиска по карте (bbox)
  @Get('map')
  async getPropertiesByMap(@Query('bbox') bbox: string, @Query() query: any) {
    // bbox: 'sw_lng,sw_lat,ne_lng,ne_lat'
    if (!bbox) throw new NotFoundException('Не переданы границы карты (bbox)');
    const [sw_lng, sw_lat, ne_lng, ne_lat] = bbox.split(',').map(Number);
    // Можно добавить фильтры (цена, статус и т.д.)
    return this.propertiesService.findByBoundingBox(sw_lng, sw_lat, ne_lng, ne_lat, query);
  }
}
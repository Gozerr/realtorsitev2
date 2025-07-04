import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Param,
  NotFoundException,
  Patch,
  Query,
  BadRequestException,
  UseGuards,
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

  @Get('all-photos')
  async getAllPhotos() {
    return this.propertiesService.getAllPhotos();
  }

  @Get('map')
  async getPropertiesByMap(@Query('bbox') bbox: string, @Query() query: any) {
    // bbox: 'sw_lng,sw_lat,ne_lng,ne_lat'
    console.log('RAW bbox:', bbox);
    const [sw_lng, sw_lat, ne_lng, ne_lat] = bbox.split(',').map(Number);
    console.log('PARSED bbox:', [sw_lng, sw_lat, ne_lng, ne_lat]);
    if ([sw_lng, sw_lat, ne_lng, ne_lat].some(x => isNaN(x))) {
      throw new BadRequestException('Некорректные координаты bbox');
    }
    // Можно добавить фильтры (цена, статус и т.д.)
    const { limit, offset, ...filters } = query;
    return this.propertiesService.findByBoundingBox(sw_lng, sw_lat, ne_lng, ne_lat, { ...filters, limit, offset });
  }

  @Get()
  async getProperties(@Query('agentId') agentId?: string) {
    if (agentId) {
      return this.propertiesService.findAllForAgent(Number(agentId));
    }
    return this.propertiesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    const agentId = req.user.id;
    return this.propertiesService.create(createPropertyDto, agentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: PropertyStatus }, @Request() req) {
    const userId = req.user.id;
    return this.propertiesService.updateStatus(+id, body.status, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) {
      throw new BadRequestException('Некорректный id объекта');
    }
    const property = await this.propertiesService.findOne(numId);
    if (!property) {
      throw new NotFoundException('Объект недвижимости не найден');
    }
    return property;
  }
}
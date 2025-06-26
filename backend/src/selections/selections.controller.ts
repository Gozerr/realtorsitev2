import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Request,
  UseGuards,
  Put,
} from '@nestjs/common';
import { SelectionsService } from './selections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('selections')
export class SelectionsController {
  constructor(private readonly selectionsService: SelectionsService) {}

  @Get()
  async findAll(@Request() req) {
    const selections = await this.selectionsService.findAllByUser(req.user);
    return selections.map(({ user, ...rest }) => rest);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const selection = await this.selectionsService.findOneById(Number(id), req.user);
    if (!selection) return { error: 'Not found' };
    const { user, ...rest } = selection;
    return rest;
  }

  @Post()
  async create(@Body() body: { title: string; propertyIds: number[] }, @Request() req) {
    const selection = await this.selectionsService.create(body.title, body.propertyIds, req.user);
    const { user, ...rest } = selection;
    return rest;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { title: string; propertyIds: number[] }, @Request() req) {
    const selection = await this.selectionsService.update(Number(id), body.title, body.propertyIds, req.user);
    if (!selection) return { error: 'Not found' };
    const { user, ...rest } = selection;
    return rest;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const ok = await this.selectionsService.remove(Number(id), req.user);
    return { success: ok };
  }
} 
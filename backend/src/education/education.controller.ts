import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EducationService } from './education.service';

@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Get()
  findAll() {
    return this.educationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.educationService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.educationService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.educationService.remove(+id);
  }
} 
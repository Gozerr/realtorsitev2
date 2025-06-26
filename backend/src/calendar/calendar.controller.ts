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
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // Все события для пользователя (личные + публичные)
  @Get()
  async findAll(@Request() req) {
    return this.calendarService.findAllForUser(req.user);
  }

  // Только личные события
  @Get('personal')
  async findPersonal(@Request() req) {
    return this.calendarService.findPersonal(req.user);
  }

  // Только публичные события
  @Get('public')
  async findPublic() {
    return this.calendarService.findPublic();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const event = await this.calendarService.findOneById(Number(id), req.user);
    if (!event) return { error: 'Not found' };
    return event;
  }

  @Post()
  async create(@Body() body: any, @Request() req) {
    // body должен содержать type: 'personal' | 'public'
    return this.calendarService.create(body, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req) {
    const event = await this.calendarService.update(Number(id), body, req.user);
    if (!event) return { error: 'Not found' };
    return event;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const ok = await this.calendarService.remove(Number(id), req.user);
    return { success: ok };
  }
} 
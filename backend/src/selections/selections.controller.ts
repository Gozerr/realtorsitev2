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
  Res,
} from '@nestjs/common';
import { SelectionsService } from './selections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('selections')
export class SelectionsController {
  constructor(private readonly selectionsService: SelectionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    const selections = await this.selectionsService.findAllByUser(req.user);
    return selections.map(({ user, ...rest }) => rest);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const selection = await this.selectionsService.findOneById(Number(id), req.user);
    if (!selection) return { error: 'Not found' };
    const { user, ...rest } = selection;
    return rest;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { title: string; propertyIds: number[] }, @Request() req) {
    const selection = await this.selectionsService.create(body.title, body.propertyIds, req.user);
    const { user, ...rest } = selection;
    return rest;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { title: string; propertyIds: number[] }, @Request() req) {
    const selection = await this.selectionsService.update(Number(id), body.title, body.propertyIds, req.user);
    if (!selection) return { error: 'Not found' };
    const { user, ...rest } = selection;
    return rest;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const ok = await this.selectionsService.remove(Number(id), req.user);
    return { success: ok };
  }

  // --- Клиентская ссылка ---
  @Get('client/:token')
  async getClientSelection(@Param('token') token: string) {
    const data = await this.selectionsService.findByClientToken(token);
    if (!data) return { error: 'Not found' };
    return data;
  }

  @Post('client/:token/like')
  async clientLike(@Param('token') token: string, @Body() body: { propertyId: number; liked: boolean }) {
    const ok = await this.selectionsService.saveClientLike(token, body.propertyId, body.liked);
    return { success: ok };
  }

  // --- Агент получает лайки клиента ---
  @UseGuards(JwtAuthGuard)
  @Get(':id/client-likes')
  async getClientLikes(@Param('id') id: string, @Request() req) {
    const likes = await this.selectionsService.getClientLikesForAgent(Number(id), req.user);
    return likes;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=selection_${id}.pdf`);
    doc.pipe(res);
    doc.pipe(fs.createWriteStream('test.pdf'));
    doc.fontSize(20).text('Тестовая страница PDF', { align: 'center' });
    doc.end();
  }
} 
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAllForAgent(@Request() req) {
    return this.clientsService.findAllForAgent(req.user.userId);
  }

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Request() req) {
    return this.clientsService.create(createClientDto, req.user.userId);
  }
} 
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getUserChats(@Req() req: any) {
    return this.chatService.getUserChats(req.user);
  }

  @Get(':chatId/messages')
  async getChatMessages(@Param('chatId') chatId: number) {
    return this.chatService.getChatMessages({ id: chatId } as any);
  }

  @Post('create')
  async createChat(
    @Body('propertyId') propertyId: number,
    @Body('buyerId') buyerId: number,
  ) {
    // Здесь можно добавить проверки на существование property и users
    return this.chatService.findOrCreateChat(
      { id: propertyId } as any,
      { id: buyerId } as any,
    );
  }

  @Post(':chatId/send')
  async sendMessage(
    @Param('chatId') chatId: number,
    @Body('authorId') authorId: number,
    @Body('text') text: string,
  ) {
    return this.chatService.sendMessage(
      { id: chatId } as any,
      { id: authorId } as any,
      text,
    );
  }
} 
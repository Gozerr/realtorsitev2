import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Body,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getConversationsForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:conversationId')
  async getMessages(@Request() req, @Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  async createConversation(@Request() req, @Body() body: { userId: number }) {
    return this.chatService.createOrGetConversation(req.user.userId, body.userId);
  }
} 
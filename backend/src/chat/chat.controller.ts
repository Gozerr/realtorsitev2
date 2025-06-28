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
import { ChatGateway } from './chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getConversationsForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:conversationId')
  async getMessages(@Request() req, @Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  async createConversation(@Request() req, @Body() body: { userId: number, propertyId: number }) {
    const conversation = await this.chatService.createOrGetConversation(req.user.id, body.userId, body.propertyId);
    this.chatGateway.emitNewConversation(conversation);
    return conversation;
  }
} 
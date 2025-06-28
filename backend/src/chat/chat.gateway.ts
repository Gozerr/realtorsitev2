import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*', // В боевом проекте лучше указать конкретный домен фронтенда
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    // JWT-аутентификация через client.handshake.auth.token
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = jwt.verify(token, 'SECRET_KEY') as any;
      client.data.userId = payload.sub || payload.userId;
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const authorId = client.data.userId;
    if (!authorId) return;
    console.log('[GATEWAY] handleSendMessage:', { authorId, data });
    try {
      const message = await this.chatService.createMessage(data.content, data.conversationId, authorId);
      console.log('[GATEWAY] Message created:', message);
      // Лог участников чата
      const conv = await this.chatService['conversationRepository'].findOne({ where: { id: data.conversationId }, relations: ['participants'] });
      if (conv) {
        console.log('[GATEWAY] Участники чата:', conv.participants.map(u => ({ id: u.id, email: u.email })));
      }
      this.server.to(data.conversationId).emit('newMessage', message);
    } catch (e) {
      console.error('[GATEWAY] Ошибка в handleSendMessage:', e);
      if (e instanceof Error && e.name === 'ForbiddenException') {
        client.emit('sendMessageError', { message: e.message });
      } else {
        client.emit('sendMessageError', { message: 'Ошибка при отправке сообщения' });
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
  }

  // Публичный метод для отправки события newConversation участникам чата
  emitNewConversation(conversation: any) {
    if (!conversation || !conversation.id || !conversation.participants) return;
    // Отправляем событие всем участникам (каждый должен быть в комнате с id чата)
    this.server.to(conversation.id).emit('newConversation', conversation);
  }

  @SubscribeMessage('messageDelivered')
  async handleMessageDelivered(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updated = await this.chatService.setMessageStatus(data.messageId, 'delivered');
      this.server.to(updated.conversation.id).emit('messageStatusUpdate', { messageId: updated.id, status: 'delivered' });
    } catch (e) {
      console.error('[GATEWAY] Ошибка в handleMessageDelivered:', e);
    }
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updated = await this.chatService.setMessageStatus(data.messageId, 'read');
      this.server.to(updated.conversation.id).emit('messageStatusUpdate', { messageId: updated.id, status: 'read' });
    } catch (e) {
      console.error('[GATEWAY] Ошибка в handleMessageRead:', e);
    }
  }
} 
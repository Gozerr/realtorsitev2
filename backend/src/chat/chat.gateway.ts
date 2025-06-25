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
    // Получаем userId из client.data (установить при аутентификации)
    const authorId = client.data.userId;
    if (!authorId) return;
    console.log('handleSendMessage:', { authorId, conversationId: data.conversationId });
    const message = await this.chatService.createMessage(data.content, data.conversationId, authorId);
    // Лог участников чата
    const conv = await this.chatService['conversationRepository'].findOne({ where: { id: data.conversationId }, relations: ['participants'] });
    if (conv) {
      console.log('Участники чата:', conv.participants.map(u => ({ id: u.id, email: u.email })));
    }
    this.server.to(data.conversationId).emit('newMessage', message);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
  }
} 
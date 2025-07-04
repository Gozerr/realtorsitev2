import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { plainToInstance } from 'class-transformer';
import { UserPublicDto } from '../users/dto/user-public.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService, private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.query.token ||
      client.handshake.auth?.token ||
      client.handshake.headers['authorization']?.split(' ')[1];
    console.log('[ChatGateway] handleConnection token:', token, 'query:', client.handshake.query, 'auth:', client.handshake.auth, 'headers:', client.handshake.headers);
    if (!token) {
      console.log('[ChatGateway] No token provided');
      return client.disconnect();
    }
    try {
      const payload = this.jwtService.verify(token);
      (client as any).user = payload;
      client.data.user = payload;
      console.log('[ChatGateway] User connected:', payload);
    } catch (err) {
      console.log('[ChatGateway] Connection error:', err, 'token:', token);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('[ChatGateway] User disconnected:', (client as any).user?.id);
  }

  @SubscribeMessage('getOrCreateChat')
  async handleGetOrCreateChat(
    @MessageBody() data: { propertyId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user || client.data.user;
    const userId = user?.id || user?.sub;
    if (!userId) throw new Error('Unauthorized');
    // Получаем property с relations: ['agent']
    const propertyRepo = (this.chatService as any).chatRepository.manager.getRepository('Property');
    const property = await propertyRepo.findOne({ where: { id: data.propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Property not found');
    if (!property.agent) throw new Error('Property has no agent');
    if (userId === property.agent.id) {
      throw new Error('Agent cannot chat with themselves');
    }
    const chat = await this.chatService.findOrCreateChat(
      property,
      { id: userId } as any,
    );
    return { chatId: chat.id };
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(@MessageBody() data: { chatId: number }, @ConnectedSocket() client: Socket) {
    const user = (client as any).user || client.data.user;
    const userId = user?.id || user?.sub;
    const chat = await this.chatService.getChatWithUsers(data.chatId);
    if (!chat) {
      client.emit('error', { message: 'Чат не найден' });
      return;
    }
    if (chat.seller.id !== userId && chat.buyer.id !== userId) {
      client.emit('error', { message: 'Нет доступа к этому чату' });
      return;
    }
    client.join(`chat_${data.chatId}`);
    console.log('[ChatGateway] joinChat:', { userId, chatId: data.chatId, socketId: client.id });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { propertyId: number; text: string; toUserId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user || client.data.user;
    console.log('[ChatGateway] sendMessage called', { user, data });
    if (!user || (!user.id && !user.sub)) {
      console.log('[ChatGateway] sendMessage: Unauthorized');
      throw new Error('Unauthorized');
    }
    if (!data.propertyId) {
      throw new Error('propertyId is required for chat');
    }
    const authorId = user.sub || user.id;
    // Получаем property с relations: ['agent']
    const propertyRepo = (this.chatService as any).chatRepository.manager.getRepository('Property');
    const property = await propertyRepo.findOne({ where: { id: data.propertyId }, relations: ['agent'] });
    if (!property) throw new Error('Property not found');
    if (!property.agent) throw new Error('Property has no agent');
    const seller = property.agent;
    let buyerId: number;
    if (authorId === seller.id) {
      if (!data.toUserId) throw new Error('toUserId is required for seller');
      buyerId = data.toUserId;
    } else {
      buyerId = authorId;
    }
    // Получаем чат и проверяем, что автор — участник
    const chat = await this.chatService.findOrCreateChat(
      property,
      { id: buyerId } as any,
    );
    if (chat.seller.id !== authorId && chat.buyer.id !== authorId) {
      throw new Error('Нет доступа к этому чату');
    }
    const message = await this.chatService.sendMessageDto({
      chatId: chat.id,
      authorId,
      text: data.text,
    });
    // Сериализуем message.author через DTO
    const safeMessage = {
      ...message,
      author: message.author ? plainToInstance(UserPublicDto, message.author) : undefined,
    };
    console.log('[ChatGateway] sendMessage emit receiveMessage', { chatId: chat.id, message: safeMessage });
    this.server.to(`chat_${chat.id}`).emit('receiveMessage', safeMessage);
    return { chatId: chat.id, message: safeMessage };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    console.log('[ChatGateway] typing:', { userId: user?.id, chatId: data.chatId });
    client.to(`chat_${data.chatId}`).emit('typing', { userId: user?.id });
  }
} 
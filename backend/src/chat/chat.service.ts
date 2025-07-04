import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { Property } from '../properties/property.entity';
import { QueryFailedError } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { UserPublicDto } from '../users/dto/user-public.dto';

export interface CreateMessageDto {
  chatId: number;
  authorId: number;
  text: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async findOrCreateChat(property: Property, buyer: User): Promise<Chat> {
    if (!property.agent) throw new Error('Property has no agent (seller)');
    const seller = property.agent;
    let chat = await this.chatRepository.findOne({
      where: {
        property: { id: property.id },
        seller: { id: seller.id },
        buyer: { id: buyer.id },
      },
      relations: ['property', 'seller', 'buyer'],
    });
    if (chat) return chat;
    try {
      chat = this.chatRepository.create({ property, seller, buyer });
      await this.chatRepository.save(chat);
      return chat;
    } catch (err) {
      if (err instanceof QueryFailedError && err.message.includes('UQ_property_seller_buyer')) {
        const existing = await this.chatRepository.findOne({
          where: {
            property: { id: property.id },
            seller: { id: seller.id },
            buyer: { id: buyer.id },
          },
          relations: ['property', 'seller', 'buyer'],
        });
        if (!existing) throw new Error('Chat exists but cannot be found after unique constraint violation');
        return existing;
      }
      throw err;
    }
  }

  async getUserChats(user: User): Promise<any[]> {
    const chats = await this.chatRepository.find({
      where: [
        { seller: { id: user.id } },
        { buyer: { id: user.id } },
      ],
      relations: ['property', 'seller', 'buyer'],
      order: { createdAt: 'DESC' },
    });
    return chats.map(chat => ({
      ...chat,
      seller: chat.seller ? plainToInstance(UserPublicDto, chat.seller) : undefined,
      buyer: chat.buyer ? plainToInstance(UserPublicDto, chat.buyer) : undefined,
      property: chat.property ? { ...chat.property } : undefined,
    }));
  }

  async getChatMessages(chat: Chat): Promise<any[]> {
    const chatId = chat.id;
    console.log('[ChatService] getChatMessages for chat.id:', chatId);
    const messages = await this.messageRepository.find({
      where: { chatId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
    console.log('[ChatService] getChatMessages found:', messages.length);
    return messages.map(msg => ({
      ...msg,
      author: msg.author ? plainToInstance(UserPublicDto, msg.author) : (msg.authorId ? { id: msg.authorId } : undefined),
    }));
  }

  async sendMessage(chat: Chat, author: User, text: string): Promise<Message> {
    const message = this.messageRepository.create({ chat, author, text });
    await this.messageRepository.save(message);
    const saved = await this.messageRepository.findOne({
      where: { id: message.id },
      relations: ['author'],
    });
    if (!saved) throw new Error('Message not found after save');
    return saved;
  }

  async sendMessageDto(dto: CreateMessageDto): Promise<Message> {
    console.log('[ChatService] sendMessageDto', dto);
    const chat = await this.chatRepository.findOne({ where: { id: dto.chatId } });
    if (!chat) {
      console.error('[ChatService] sendMessageDto: Chat not found', dto.chatId);
      throw new Error(`Chat with id ${dto.chatId} not found`);
    }
    const author = await this.messageRepository.manager.getRepository(User).findOne({ where: { id: dto.authorId } });
    if (!author) {
      console.error('[ChatService] sendMessageDto: User not found', dto.authorId);
      throw new Error(`User with id ${dto.authorId} not found`);
    }
    const message = this.messageRepository.create({ chat, chatId: chat.id, author, authorId: author.id, text: dto.text });
    await this.messageRepository.save(message);
    const saved = await this.messageRepository.findOne({
      where: { id: message.id },
      relations: ['author'],
    });
    if (!saved) {
      console.error('[ChatService] sendMessageDto: Message not found after save');
      throw new Error('Message not found after save');
    }
    console.log('[ChatService] sendMessageDto: Message saved', saved);
    return saved;
  }

  async getChatWithUsers(chatId: number): Promise<Chat | null> {
    return this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['seller', 'buyer'],
    });
  }
} 
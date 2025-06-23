import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createMessage(content: string, conversationId: string, authorId: number): Promise<Message> {
    const conversation = await this.conversationRepository.findOneOrFail({ where: { id: conversationId } });
    const author = await this.userRepository.findOneOrFail({ where: { id: authorId } });

    const message = this.messageRepository.create({
      content,
      conversation,
      author,
    });

    return this.messageRepository.save(message);
  }

  async getConversationsForUser(userId: number): Promise<Conversation[]> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.participants', 'user')
      .where('user.id = :userId', { userId })
      .leftJoinAndSelect('conversation.messages', 'message')
      .leftJoinAndSelect('message.author', 'author')
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }
} 
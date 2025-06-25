import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  // Получить или создать чат между двумя пользователями
  async createOrGetConversation(userId1: number, userId2: number): Promise<Conversation> {
    if (userId1 === userId2) throw new ForbiddenException('Нельзя создать чат с самим собой');
    // Получаем все чаты с двумя участниками
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'user')
      .leftJoinAndSelect('conversation.messages', 'message')
      .leftJoinAndSelect('message.author', 'author')
      .getMany();
    // Ищем чат, где участники — именно нужные два пользователя
    const found = conversations.find(conv => {
      const ids = conv.participants.map(u => u.id).sort();
      return ids.length === 2 && ids.includes(userId1) && ids.includes(userId2);
    });
    if (found) return found;
    // Если не найден — создаём новый
    const user1 = await this.userRepository.findOneOrFail({ where: { id: userId1 } });
    const user2 = await this.userRepository.findOneOrFail({ where: { id: userId2 } });
    const conversation = this.conversationRepository.create({ participants: [user1, user2], messages: [] });
    await this.conversationRepository.save(conversation);
    return this.conversationRepository.findOneOrFail({
      where: { id: conversation.id },
      relations: ['participants', 'messages', 'messages.author'],
    });
  }

  // Получить все чаты пользователя (только 1-1)
  async getConversationsForUser(userId: number): Promise<Conversation[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'user')
      .leftJoinAndSelect('conversation.messages', 'message')
      .leftJoinAndSelect('message.author', 'author')
      .getMany();
    // Оставляем только чаты, где есть этот пользователь и всего 2 участника
    return conversations.filter(conv =>
      conv.participants.length === 2 && conv.participants.some(u => u.id === userId)
    );
  }

  // Получить историю сообщений чата (только для участников)
  async getMessages(conversationId: string, userId: number): Promise<Message[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conversation) throw new NotFoundException('Чат не найден');
    if (!conversation.participants.some(u => u.id === userId)) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  // Отправить сообщение (только участник чата)
  async createMessage(content: string, conversationId: string, authorId: number): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conversation) throw new NotFoundException('Чат не найден');
    if (!conversation.participants.some(u => u.id === authorId)) {
      throw new ForbiddenException('Вы не участник этого чата');
    }
    const author = await this.userRepository.findOneOrFail({ where: { id: authorId } });
    const message = this.messageRepository.create({
      content,
      conversation,
      author,
    });
    return this.messageRepository.save(message);
  }
} 
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { Property } from '../properties/property.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  // Получить или создать чат между двумя пользователями по propertyId
  async createOrGetConversation(userId1: number, userId2: number, propertyId: number): Promise<Conversation> {
    if (userId1 === userId2) throw new ForbiddenException('Нельзя создать чат с самим собой');
    // Получаем все чаты с двумя участниками и propertyId
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'user')
      .leftJoinAndSelect('conversation.messages', 'message')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('conversation.property', 'property')
      .where('conversation.property = :propertyId', { propertyId })
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
    const property = await this.propertyRepository.findOneOrFail({ where: { id: propertyId } });
    const conversation = this.conversationRepository.create({ participants: [user1, user2], messages: [], property });
    await this.conversationRepository.save(conversation);
    return this.conversationRepository.findOneOrFail({
      where: { id: conversation.id },
      relations: ['participants', 'messages', 'messages.author', 'property'],
    });
  }

  // Получить все чаты пользователя (только 1-1)
  async getConversationsForUser(userId: number): Promise<Conversation[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'user')
      .leftJoinAndSelect('conversation.messages', 'message')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('conversation.property', 'property')
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
      relations: ['participants', 'property'],
    });
    if (!conversation) throw new NotFoundException('Чат не найден');
    if (!conversation.participants.some(u => u.id === authorId)) {
      throw new ForbiddenException('Вы не участник этого чата');
    }
    // Проверка: если в чате только один участник (текущий пользователь), не даём писать самому себе
    if (conversation.participants.length === 1 && conversation.participants[0].id === authorId) {
      throw new ForbiddenException('Вы не можете писать сами себе по объекту');
    }
    const author = await this.userRepository.findOneOrFail({ where: { id: authorId } });
    const message = this.messageRepository.create({
      content,
      conversation,
      author,
    });
    const saved = await this.messageRepository.save(message);
    // Возвращаем сообщение с author и conversation (и property, и participants)
    return this.messageRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['author', 'conversation', 'conversation.property', 'conversation.participants'],
    });
  }

  // Обновить статус сообщения
  async setMessageStatus(messageId: string, status: 'delivered' | 'read'): Promise<Message> {
    const message = await this.messageRepository.findOneOrFail({ where: { id: messageId }, relations: ['author', 'conversation', 'conversation.property', 'conversation.participants'] });
    message.status = status;
    await this.messageRepository.save(message);
    return message;
  }
} 
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User, UserRole } from '../users/user.entity';
import { Property, PropertyStatus } from '../properties/property.entity';

describe('ChatService', () => {
  let service: ChatService;
  let conversationRepository: Repository<Conversation>;
  let messageRepository: Repository<Message>;
  let userRepository: Repository<User>;
  let propertyRepository: Repository<Property>;

  const mockUser = {
    id: 1,
    email: 'user@test.com',
    password: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    photo: '',
    phone: '',
    city: '',
    region: '',
    role: UserRole.AGENT,
    agency: { id: 1, name: 'Test Agency', users: [] },
    properties: [],
    clients: [],
    telegramId: '',
  };

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    description: 'Test Description',
    address: 'Test Address',
    price: 100000,
    area: 100,
    bedrooms: 3,
    bathrooms: 2,
    status: PropertyStatus.FOR_SALE,
    isExclusive: false,
    photos: [],
    agent: mockUser,
    createdAt: new Date(),
    lat: 0,
    lng: 0,
    floor: 0,
    totalFloors: 0,
    link: '',
    pricePerM2: 0,
    externalId: '',
    seller: '',
    datePublished: '',
  };

  const mockConversation = {
    id: 'conv-1',
    participants: [mockUser, { ...mockUser, id: 2 }],
    messages: [],
    property: mockProperty,
  };

  const mockMessage = {
    id: 'msg-1',
    content: 'Hello',
    createdAt: new Date(),
    author: mockUser,
    conversation: mockConversation,
    status: 'sent' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              findOne: jest.fn(),
              findOneOrFail: jest.fn(),
              create: jest.fn(),
              save: jest.fn(),
            })),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            find: jest.fn(),
            findOneOrFail: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Property),
          useValue: {
            findOneOrFail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationRepository = module.get<Repository<Conversation>>(
      getRepositoryToken(Conversation),
    );
    messageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    propertyRepository = module.get<Repository<Property>>(
      getRepositoryToken(Property),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConversationsForUser', () => {
    it('should return conversations for user', async () => {
      const mockConversations = [mockConversation];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockConversations),
      };
      jest
        .spyOn(conversationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getConversationsForUser(1);

      expect(result).toEqual(mockConversations);
    });
  });

  describe('getMessages', () => {
    it('should return messages for conversation', async () => {
      const mockMessages = [mockMessage];
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockResolvedValue(mockConversation);
      jest.spyOn(messageRepository, 'find').mockResolvedValue(mockMessages);

      const result = await service.getMessages('conv-1', 1);

      expect(result).toEqual(mockMessages);
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockResolvedValue(mockConversation);
      jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValue(mockUser);
      jest.spyOn(messageRepository, 'create').mockReturnValue(mockMessage);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage);
      jest
        .spyOn(messageRepository, 'findOneOrFail')
        .mockResolvedValue(mockMessage);

      const result = await service.createMessage('Hello', 'conv-1', 1);

      expect(result).toEqual(mockMessage);
      expect(messageRepository.create).toHaveBeenCalledWith({
        content: 'Hello',
        conversation: mockConversation,
        author: mockUser,
      });
    });
  });

  describe('createOrGetConversation', () => {
    it('should create or get conversation', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(conversationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValue(mockUser);
      jest
        .spyOn(propertyRepository, 'findOneOrFail')
        .mockResolvedValue(mockProperty);
      jest
        .spyOn(conversationRepository, 'create')
        .mockReturnValue(mockConversation);
      jest
        .spyOn(conversationRepository, 'save')
        .mockResolvedValue(mockConversation);
      jest
        .spyOn(conversationRepository, 'findOneOrFail')
        .mockResolvedValue(mockConversation);

      const result = await service.createOrGetConversation(1, 2, 1);

      expect(result).toEqual(mockConversation);
    });
  });

  describe('privacy between different agent-object chats', () => {
    it('should not allow agent1 to see messages from agent3 in a different chat with agent2 for the same property', async () => {
      // agent2 — владелец объекта
      const agent2 = { ...mockUser, id: 2 };
      const agent1 = { ...mockUser, id: 1 };
      const agent3 = { ...mockUser, id: 3 };
      const property = { ...mockProperty, id: 100, agent: agent2 };

      // Чат agent1 <-> agent2 по объекту 100
      const conversation1 = {
        id: 'conv-1',
        participants: [agent1, agent2],
        messages: [
          {
            ...mockMessage,
            id: 'm1',
            author: agent1,
            content: 'msg1',
            conversation: { id: 'conv-1' },
          },
        ],
        property,
      };
      // Чат agent3 <-> agent2 по объекту 100
      const conversation2 = {
        id: 'conv-2',
        participants: [agent3, agent2],
        messages: [
          {
            ...mockMessage,
            id: 'm2',
            author: agent3,
            content: 'msg2',
            conversation: { id: 'conv-2' },
          },
        ],
        property,
      };

      // agent1 пытается получить сообщения из conv-2 (где он не участник)
      jest
        .spyOn(conversationRepository, 'findOne')
        .mockImplementation(async ({ where }) => {
          if (where.id === 'conv-1') return conversation1;
          if (where.id === 'conv-2') return conversation2;
          return null;
        });
      jest
        .spyOn(messageRepository, 'find')
        .mockImplementation(async ({ where }) => {
          if (where.conversation.id === 'conv-1') return conversation1.messages;
          if (where.conversation.id === 'conv-2') return conversation2.messages;
          return [];
        });

      // agent1 видит только свой чат
      const msgs1 = await service.getMessages('conv-1', 1);
      expect(msgs1.length).toBe(1);
      expect(msgs1[0].content).toBe('msg1');

      // agent1 не видит чужой чат (403)
      await expect(service.getMessages('conv-2', 1)).rejects.toThrow(
        'Нет доступа к этому чату',
      );

      // agent3 видит только свой чат
      const msgs3 = await service.getMessages('conv-2', 3);
      expect(msgs3.length).toBe(1);
      expect(msgs3[0].content).toBe('msg2');

      // agent3 не видит чужой чат (403)
      await expect(service.getMessages('conv-1', 3)).rejects.toThrow(
        'Нет доступа к этому чату',
      );
    });
  });
});

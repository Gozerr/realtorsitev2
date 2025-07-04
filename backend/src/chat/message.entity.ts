import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Chat } from './chat.entity';

@Entity('messages')
@Index('IDX_messages_chat', ['chat'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Column()
  chatId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: false })
  authorId: number;

  @Column('text')
  text: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 16, default: 'sent' })
  status: string;
} 
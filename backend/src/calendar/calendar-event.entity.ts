import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type CalendarEventType = 'personal' | 'public';

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'datetime' })
  start: Date;

  @Column({ type: 'datetime', nullable: true })
  end: Date;

  @Column({ type: 'varchar', default: 'personal' })
  type: CalendarEventType;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  relatedObjectId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 
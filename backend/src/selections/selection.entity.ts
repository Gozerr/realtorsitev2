import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('selections')
export class Selection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('simple-array')
  propertyIds: number[];

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
} 
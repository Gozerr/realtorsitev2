import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Message } from './message.entity';
import { Property } from '../properties/property.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @ManyToOne(() => Property, { nullable: false })
  property: Property;
} 
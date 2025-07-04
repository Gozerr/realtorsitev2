import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Property } from '../properties/property.entity';

@Entity('chats')
@Unique('UQ_property_seller_buyer', ['property', 'seller', 'buyer'])
@Index('IDX_chats_user', ['seller', 'buyer'])
@Index('IDX_chats_property', ['property'])
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: 'CASCADE' })
  property: Property;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  seller: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  buyer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 
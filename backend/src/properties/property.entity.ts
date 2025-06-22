import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum PropertyStatus {
  FOR_SALE = 'for_sale',
  IN_DEAL = 'in_deal',
  SOLD = 'sold',
}

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  address: string;

  @Column('decimal')
  price: number;

  @Column('float')
  area: number;

  @Column()
  bedrooms: number;

  @Column()
  bathrooms: number;

  @Column({
    type: 'simple-enum',
    enum: PropertyStatus,
    default: PropertyStatus.FOR_SALE,
  })
  status: PropertyStatus;

  @Column({ type: 'boolean', default: false })
  isExclusive: boolean;

  @Column('simple-array', { nullable: true })
  photos: string[];

  @ManyToOne(() => User, user => user.properties)
  agent: User;

  @CreateDateColumn()
  createdAt: Date;
}
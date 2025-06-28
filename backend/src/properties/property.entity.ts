import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PropertyStatus {
  FOR_SALE = 'for_sale',
  IN_DEAL = 'in_deal',
  RESERVED = 'reserved',
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

  @Column('simple-json', { nullable: true })
  photos: string[];

  @ManyToOne(() => User, user => user.properties, { nullable: true })
  agent: User | null;
  
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @Column({ type: 'int', nullable: true })
  floor: number;

  @Column({ type: 'int', nullable: true })
  totalFloors: number;

  @Column({ type: 'varchar', nullable: true })
  link: string;

  @Column({ type: 'decimal', nullable: true })
  pricePerM2: number;

  @Column({ type: 'varchar', nullable: true })
  externalId: string;

  @Column({ type: 'varchar', nullable: true })
  seller: string;

  @Column({ type: 'varchar', nullable: true })
  datePublished: string;
}
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum ClientStatus {
  NEW = 'new',
  NEGOTIATION = 'negotiation',
  CONTRACT = 'contract',
  DEPOSIT = 'deposit',
  SUCCESS = 'success',
  REFUSED = 'refused',
}

@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({
    type: 'simple-enum',
    enum: ClientStatus,
    default: ClientStatus.NEW,
  })
  status: ClientStatus;

  @ManyToOne(() => User, user => user.clients)
  agent: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 
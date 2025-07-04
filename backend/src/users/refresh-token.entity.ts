import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column()
  userId: number;

  @Column({ type: 'timestamp' })
  expires: Date;
} 
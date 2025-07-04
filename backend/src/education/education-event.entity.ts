import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('education_events')
export class EducationEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ default: 'course' })
  type: string; // course, webinar, reminder, etc.

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  img: string;

  @Column({ nullable: true })
  place: string;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 
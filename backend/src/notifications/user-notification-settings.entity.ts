import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_notification_settings')
export class UserNotificationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @Column({ default: true })
  property: boolean;

  @Column({ default: true })
  education: boolean;

  @Column({ default: true })
  system: boolean;
} 
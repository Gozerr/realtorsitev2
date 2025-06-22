import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Agency } from '../agencies/agency.entity';
import { Property } from '../properties/property.entity';
import { Client } from '../clients/client.entity';

export enum UserRole {
  AGENT = 'agent',
  DIRECTOR = 'director',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.AGENT,
  })
  role: UserRole;

  @ManyToOne(() => Agency, agency => agency.users)
  agency: Agency;

  @OneToMany(() => Property, property => property.agent)
  properties: Property[];

  @OneToMany(() => Client, client => client.agent)
  clients: Client[];
} 
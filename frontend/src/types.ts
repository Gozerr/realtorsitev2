// C:/Users/OMEN/Desktop/realtorsite/frontend/src/types.ts

export interface User {
  id: number;
  email: string;
  agencyId?: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface Agency {
  id: number;
  name: string;
}

export enum PropertyStatus {
  FOR_SALE = 'for_sale',
  IN_DEAL = 'in_deal',
  SOLD = 'sold',
}

export interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  description: string;
  agent: User;
  createdAt: string;
  status: PropertyStatus;
  isExclusive: boolean;
}

export interface CreatePropertyData {
  title: string;
  address: string;
  price: number;
  description: string;
  status?: PropertyStatus;
  isExclusive?: boolean;
}

export enum ClientStatus {
  NEW = 'new',
  NEGOTIATION = 'negotiation',
  CONTRACT = 'contract',
  DEPOSIT = 'deposit',
  SUCCESS = 'success',
  REFUSED = 'refused',
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone: string;
  status?: ClientStatus;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  conversation: Conversation;
}

export interface Conversation {
  id:string;
  participants: User[];
  messages: Message[];
}
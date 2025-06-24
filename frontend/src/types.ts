// C:/Users/OMEN/Desktop/realtorsite/frontend/src/types.ts

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  role: 'agent' | 'director';
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
  status: PropertyStatus;
  description?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  isExclusive?: boolean;
  photos?: string[];
  agent?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photo?: string;
  };
  createdAt?: string;
  lat?: number;
  lng?: number;
  // Дополнительные поля для совместимости
  images?: string[];
  agency?: string;
  datePublished?: string;
  type?: string;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  latitude?: number;
  longitude?: number;
  [key: string]: any; // для расширяемости
}

export interface CreatePropertyData {
  title: string;
  address: string;
  price: number;
  description?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  isExclusive?: boolean;
  photos?: string[];
  // Дополнительные поля для совместимости
  status?: string;
  images?: string[];
  agency?: string;
  type?: string;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  latitude?: number;
  longitude?: number;
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
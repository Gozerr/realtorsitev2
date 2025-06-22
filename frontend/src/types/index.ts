export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Property {
  id: number;
  title: string;
  price: number;
  address: string;
}

export type CreatePropertyData = Omit<Property, 'id'>; 
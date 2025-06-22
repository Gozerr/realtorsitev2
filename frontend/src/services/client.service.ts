import api from './api';
import { Client, CreateClientData } from '../types';

export const getClients = async (token: string): Promise<Client[]> => {
  const response = await api.get('/clients', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createClient = async (data: CreateClientData, token: string): Promise<Client> => {
  const response = await api.post('/clients', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}; 
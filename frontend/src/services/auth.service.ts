import api from './api';
import { LoginCredentials, User } from '../types';

export const login = async (credentials: LoginCredentials): Promise<{ access_token: string; user: User }> => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/api/users/profile', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const response = await api.patch(`/users/${id}`, userData);
  return response.data;
};

export const getProfile = async (token?: string): Promise<User> => {
  const response = await api.get('/api/users/profile', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}; 
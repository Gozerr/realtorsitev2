import api from './api';
import { LoginCredentials, User } from '../types';

export const login = async (credentials: LoginCredentials): Promise<{ access_token: string; user: User }> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/users/profile', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const response = await api.patch(`/users/${id}`, userData);
  return response.data;
}; 
import api from './api';
import { LoginCredentials, User } from '../types';

export const login = async (credentials: LoginCredentials, config?: any): Promise<{ access_token: string; user: User }> => {
  const response = await api.post('/api/auth/login', credentials, config);
  return response.data;
};

export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/api/users/profile', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const response = await api.patch(`/api/users/${id}`, userData);
  return response.data;
};

export const getProfile = async (token?: string): Promise<User> => {
  const response = await api.get('/api/users/profile', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
};

// Получить новый access_token по refresh_token (cookie)
export async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // чтобы отправлялись cookies
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
} 
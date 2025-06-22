import api from './api';
import { LoginCredentials } from '../types'; // Создадим этот тип позже

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}; 
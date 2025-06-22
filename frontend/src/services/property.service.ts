import { Property, CreatePropertyData } from '../types';
import api from './api';

export const getStatistics = async (): Promise<{ total: number; forSale: number; exclusives: number }> => {
  const response = await api.get('/properties/statistics');
  return response.data;
};

export const getMyProperties = async (token: string): Promise<Property[]> => {
  const response = await api.get('/properties', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getRecentProperties = async (): Promise<Property[]> => {
  const response = await api.get('/properties/recent');
  return response.data;
};

export const createProperty = async (data: CreatePropertyData, token: string): Promise<Property> => {
  const response = await api.post('/properties', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}; 
import { Property, CreatePropertyData } from '../types';
import api from './api';
import axios from 'axios';

export async function updatePropertyCoords(id: string | number, lat: number, lng: number) {
  return axios.patch(`/api/properties/${id}/coords`, { lat, lng });
}

export const getStatistics = async (): Promise<{ total: number; forSale: number; exclusives: number }> => {
  const response = await api.get('/api/properties/statistics');
  return response.data;
};

export const getMyProperties = async (token: string): Promise<Property[]> => {
  const response = await api.get('/api/properties', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getRecentProperties = async (): Promise<Property[]> => {
  const response = await api.get('/api/properties/recent');
  return response.data;
};

export const getPropertyById = async (id: string, token?: string): Promise<Property> => {
  if (token) {
    const response = await api.get(`/api/properties/${id}`,{ headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } else {
    const response = await api.get(`/api/properties/${id}`);
    return response.data;
  }
};

export const createProperty = async (data: CreatePropertyData, token: string): Promise<Property> => {
  const response = await api.post('/api/properties', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updatePropertyStatus = async (id: number, status: string, token?: string) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await api.patch(`/api/properties/${id}/status`, { status }, headers ? { headers } : undefined);
  return response.data;
};

export const getPropertiesByAgent = async (agentId: number) => {
  const res = await api.get(`/api/properties?agentId=${agentId}`);
  return res.data;
};

export interface PropertiesResponse {
  properties: Property[];
  total: number;
}

export const getAllProperties = async (): Promise<PropertiesResponse> => {
  const response = await api.get('/api/properties');
  return response.data;
}; 
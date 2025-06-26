import api from './api';
import { Conversation, Message } from '../types';

export const createOrGetConversation = async (userId: number): Promise<Conversation> => {
  const res = await api.post('/api/chat/conversations', { userId });
  return res.data;
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const res = await api.get(`/api/chat/messages/${conversationId}`);
  return res.data;
}; 
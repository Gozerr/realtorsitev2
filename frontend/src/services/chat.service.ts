import api from './api';
import { Conversation, Message } from '../types';

export const createOrGetConversation = async (userId: number): Promise<Conversation> => {
  const res = await api.post('/chat/conversations', { userId });
  return res.data;
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const res = await api.get(`/chat/messages/${conversationId}`);
  return res.data;
}; 
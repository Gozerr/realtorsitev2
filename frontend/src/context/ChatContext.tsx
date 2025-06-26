import React, { createContext, useState, useEffect, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { Conversation, Message } from '../types';
import api from '../services/api';

interface ChatContextType {
  socket: Socket | null;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  selectConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string) => void;
}

export const ChatContext = createContext<ChatContextType>({
  socket: null,
  conversations: [],
  selectedConversation: null,
  messages: [],
  selectConversation: () => {},
  sendMessage: () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const authContext = useContext(AuthContext);

  // Адрес socket.io берём из переменной окружения или по умолчанию
  const SOCKET_IO_URL = process.env.REACT_APP_SOCKET_IO_URL || 'http://localhost:3000';

  useEffect(() => {
    if (authContext?.token) {
      const newSocket = io(SOCKET_IO_URL, {
        auth: { token: authContext.token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      newSocket.on('connect_error', (err) => {
        console.error('Socket.IO connection error (chat):', err);
      });
      newSocket.on('disconnect', (reason) => {
        console.warn('Socket.IO disconnected (chat):', reason);
      });
      setSocket(newSocket);
      
      api.get('/api/chat/conversations').then(response => {
        setConversations(response.data);
      });

      newSocket.on('newMessage', (newMessage: Message) => {
        setMessages(prev => [...prev, newMessage]);
      });

      return () => {
        newSocket.off('newMessage');
        newSocket.close();
      };
    }
  }, [authContext?.token]);

  const selectConversation = (conversation: Conversation | null) => {
    setSelectedConversation(conversation);
    setMessages([]);
    if (socket && conversation) {
      socket.emit('joinRoom', conversation.id);
      api.get(`/chat/messages/${conversation.id}`).then(res => {
        setMessages(res.data);
      });
    }
  };

  const sendMessage = (content: string) => {
    if (!socket || !selectedConversation || !content.trim()) return;
    socket.emit('sendMessage', {
      conversationId: selectedConversation.id,
      content,
    });
  };

  return (
    <ChatContext.Provider value={{ socket, conversations, selectedConversation, messages, selectConversation, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}; 
import React, { createContext, useState, useEffect, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { Conversation, Message } from '../types';
import api from '../services/api';

interface ChatContextType {
  socket: Socket | null;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  selectConversation: (conversation: Conversation | null) => void;
}

export const ChatContext = createContext<ChatContextType>({
  socket: null,
  conversations: [],
  selectedConversation: null,
  selectConversation: () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (authContext?.token) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);
      
      api.get('/chat/conversations').then(response => {
        setConversations(response.data);
      });

      newSocket.on('newMessage', (newMessage: Message) => {
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv.id === newMessage.conversation.id) {
              return { ...conv, messages: [newMessage, ...conv.messages] };
            }
            return conv;
          });
        });
        // Также обновляем выбранную беседу, если она активна
        setSelectedConversation(prev => {
            if (prev && prev.id === newMessage.conversation.id) {
                return { ...prev, messages: [newMessage, ...prev.messages] };
            }
            return prev;
        })
      });

      return () => {
        newSocket.off('newMessage');
        newSocket.close();
      };
    }
  }, [authContext?.token]);

  const selectConversation = (conversation: Conversation | null) => {
    setSelectedConversation(conversation);
    // Присоединяемся к комнате чата на сервере
    if(socket && conversation) {
      socket.emit('joinRoom', conversation.id);
    }
  };


  return (
    <ChatContext.Provider value={{ socket, conversations, selectedConversation, selectConversation }}>
      {children}
    </ChatContext.Provider>
  );
}; 
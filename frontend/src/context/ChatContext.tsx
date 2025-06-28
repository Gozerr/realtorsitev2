import React, { createContext, useState, useEffect, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { Conversation, Message } from '../types';
import api from '../services/api';
import { message as antdMessage } from 'antd';

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
      
      api.get('/chat/conversations').then(response => {
        setConversations(response.data);
      });

      newSocket.on('newMessage', (newMessage: Message) => {
        console.log('[ChatContext] newMessage received:', newMessage);
        // Если это не ваше сообщение — отправить delivered
        if (authContext?.user && newMessage.author.id !== authContext.user.id) {
          newSocket.emit('messageDelivered', { messageId: newMessage.id });
        }
        setConversations(prevConvs => {
          const exists = prevConvs.some(conv => conv.id === newMessage.conversation.id);
          let updatedConvs;
          if (exists) {
            updatedConvs = prevConvs.map(conv =>
              conv.id === newMessage.conversation.id
                ? { ...conv, messages: [...(conv.messages || []), newMessage] }
                : conv
            );
          } else {
            // Новый чат — добавляем его
            updatedConvs = [
              ...prevConvs,
              {
                ...newMessage.conversation,
                messages: [newMessage],
              }
            ];
          }
          console.log('[ChatContext] conversations after newMessage:', updatedConvs);
          return updatedConvs;
        });
      });

      // Обработка обновления статуса сообщения
      newSocket.on('messageStatusUpdate', ({ messageId, status }) => {
        setConversations(prevConvs => prevConvs.map(conv => ({
          ...conv,
          messages: conv.messages?.map(msg =>
            msg.id === messageId ? { ...msg, status } : msg
          ) || [],
        })));
      });

      // Подписка на появление нового чата (newConversation)
      newSocket.on('newConversation', (newConv: Conversation) => {
        console.log('[ChatContext] newConversation received:', newConv);
        setConversations(prevConvs => {
          const exists = prevConvs.some(conv => conv.id === newConv.id);
          if (exists) return prevConvs;
          const updated = [...prevConvs, { ...newConv, messages: newConv.messages || [] }];
          console.log('[ChatContext] conversations after newConversation:', updated);
          // Сразу подписываемся на комнату нового чата
          if (newSocket) {
            newSocket.emit('joinRoom', newConv.id);
            // Подгружаем сообщения для нового чата
            api.get(`/chat/messages/${newConv.id}`).then(res => {
              setConversations(prev => prev.map(c => c.id === newConv.id ? { ...c, messages: res.data } : c));
              console.log('[ChatContext] messages loaded for newConversation:', res.data);
            });
          }
          return updated;
        });
        // Если нет выбранного чата — выбираем только что появившийся
        setTimeout(() => {
          setSelectedConversation(prev => prev || { ...newConv, messages: newConv.messages || [] });
        }, 0);
      });

      return () => {
        newSocket.off('newMessage');
        newSocket.off('newConversation');
        newSocket.close();
      };
    }
  }, [authContext?.token]);

  // Реактивная синхронизация messages с conversations и selectedConversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    const conv = conversations.find(c => c.id === selectedConversation.id);
    setMessages(conv?.messages || []);
  }, [selectedConversation, conversations]);

  useEffect(() => {
    if (socket && conversations.length > 0) {
      conversations.forEach(conv => {
        socket.emit('joinRoom', conv.id);
      });
    }
  }, [socket, conversations]);

  useEffect(() => {
    if (!socket) return;
    const handleSendMessageError = (data: { message: string }) => {
      antdMessage.error(data.message || 'Ошибка при отправке сообщения');
    };
    socket.on('sendMessageError', handleSendMessageError);
    return () => {
      socket.off('sendMessageError', handleSendMessageError);
    };
  }, [socket]);

  // Синхронизация selectedConversation с conversations
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated && updated !== selectedConversation) {
        setSelectedConversation(updated);
        console.log('[ChatContext] selectedConversation updated:', updated);
      }
    }
    console.log('[ChatContext] selectedConversation:', selectedConversation);
    console.log('[ChatContext] conversations:', conversations);
  }, [conversations]);

  // Если появился новый чат и нет выбранного, автоматически выбираем первый чат
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Автоматическая подгрузка сообщений для всех чатов при логине
  useEffect(() => {
    if (authContext?.user && conversations.length > 0) {
      console.log('[ChatContext] Автоподгрузка сообщений для всех чатов при логине');
      conversations.forEach(async (conv) => {
        if (!conv.messages || conv.messages.length === 0) {
          try {
            const res = await api.get(`/chat/messages/${conv.id}`);
            setConversations(prevConvs => prevConvs.map(c => c.id === conv.id ? { ...c, messages: res.data } : c));
            console.log(`[ChatContext] Сообщения подгружены для чата ${conv.id}:`, res.data);
          } catch (e) {
            console.error(`[ChatContext] Ошибка подгрузки сообщений для чата ${conv.id}:`, e);
          }
        }
      });
    }
  }, [authContext?.user, conversations.length]);

  // При открытии чата — отправлять messageRead для всех чужих сообщений, не прочитанных
  useEffect(() => {
    if (!socket || !selectedConversation || !authContext?.user) return;
    const unread = messages.filter(m => authContext?.user && m.author.id !== authContext.user.id && m.status !== 'read');
    unread.forEach(msg => {
      socket.emit('messageRead', { messageId: msg.id });
    });
  }, [socket, selectedConversation, messages, authContext?.user]);

  const selectConversation = (conversation: Conversation | null) => {
    console.log('[selectConversation] called with:', conversation);
    setSelectedConversation(conversation);
    if (socket && conversation) {
      console.log('[socket.emit] joinRoom', conversation.id);
      socket.emit('joinRoom', conversation.id);
      api.get(`/chat/messages/${conversation.id}`).then(res => {
        setMessages(res.data);
        console.log('[selectConversation] messages loaded:', res.data);
      });
    }
  };

  const sendMessage = (content: string) => {
    if (!socket || !selectedConversation || !content.trim()) return;
    // Проверка: если в чате только один участник (текущий пользователь), не отправлять сообщение
    if (selectedConversation.participants.length === 1 && selectedConversation.participants[0].id === authContext?.user?.id) {
      antdMessage.error('Вы не можете писать сами себе по объекту');
      return;
    }
    console.log('[socket.emit] sendMessage', selectedConversation.id, content);
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
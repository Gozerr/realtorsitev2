import api from './api';
import { io } from 'socket.io-client';

// Always use backend on port 3001 for notifications WebSocket, regardless of frontend port
const BACKEND_HOST = window.location.hostname;
const SOCKET_IO_URL = `http://${BACKEND_HOST}:3001`;

let socket: ReturnType<typeof io> | null = null;
let currentUserId: number | null = null;

export function subscribeToNotifications(userId: number, onNotification: (notif: any) => void) {
  if (socket && currentUserId !== userId) {
    socket.disconnect();
    socket = null;
  }
  currentUserId = userId;
  if (!socket) {
    socket = io(SOCKET_IO_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socket.on('connect', () => {
      socket!.emit('joinRoom', `user_${userId}`);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error (notifications):', err);
    });
    socket.on('disconnect', (reason) => {
      console.warn('Socket.IO disconnected (notifications):', reason);
    });
  }
  const handler = (notif: any) => {
    if (!(window as any)._lastNotifIds) (window as any)._lastNotifIds = new Set();
    if (!(window as any)._lastNotifIds.has(notif.id)) {
      (window as any)._lastNotifIds.add(notif.id);
      onNotification(notif);
    }
  };
  socket.on('newNotification', handler);
  return () => {
    socket?.off('newNotification', handler);
  };
}

export const getAllNotifications = async () => {
  const res = await api.get('/api/notifications');
  return res.data;
};

export const getUserNotifications = async (userId: number) => {
  const res = await api.get(`/api/notifications/user/${userId}`);
  return res.data;
};

export const createNotification = async (data: any) => {
  const res = await api.post('/api/notifications', data);
  return res.data;
};

export const markNotificationAsRead = async (id: number) => {
  await api.patch(`/api/notifications/${id}/read`);
};

export const removeNotification = async (id: number) => {
  await api.delete(`/api/notifications/${id}`);
};

export const getUserNotificationSettings = async (userId: number) => {
  const res = await api.get(`/api/notifications/settings/${userId}`);
  return res.data;
};

export const updateUserNotificationSettings = async (userId: number, data: any) => {
  const res = await api.post(`/api/notifications/settings/${userId}`, data);
  return res.data;
}; 
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserNotifications, subscribeToNotifications } from '../services/notification.service';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext<any>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!authContext?.user?.id) {
      setNotifications([]);
      return;
    }
    getUserNotifications(authContext.user.id).then(setNotifications);
    const unsubscribe = subscribeToNotifications(authContext.user.id, notif => {
      setNotifications(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]);
    });
    return () => { unsubscribe && unsubscribe(); };
  }, [authContext?.user?.id]);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext); 
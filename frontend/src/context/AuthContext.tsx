import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  setAuthData: (token: string | null, user: User | null, refreshToken?: string | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const setAuthData = (newToken: string | null, newUser: User | null, refreshToken?: string | null) => {
    setToken(newToken);
    setUser(newUser);

    if (newToken && newUser) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
    }
  };

  const setTokenOnly = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
  };

  // Слушаем изменения токена в localStorage (например, после refresh в другом окне или через axios)
  useEffect(() => {
    const syncToken = () => {
      const newToken = localStorage.getItem('token');
      if (newToken !== token) setToken(newToken);
    };
    window.addEventListener('storage', syncToken);
    return () => window.removeEventListener('storage', syncToken);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, setAuthData, setToken: setTokenOnly, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 
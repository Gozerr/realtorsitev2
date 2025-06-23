import React, { createContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  setAuthData: (token: string | null, user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const setAuthData = (newToken: string | null, newUser: User | null) => {
    setToken(newToken);
    setUser(newUser);

    if (newToken && newUser) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}; 
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface AuthContextType {
  token: string | null;
  login: (email: string, mdp: string) => Promise<boolean>;
  register: (email: string, mdp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email: string, mdp: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', mdp);

      const response = await api.post('/token', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const access_token = response.data.access_token;
      await AsyncStorage.setItem('userToken', access_token);
      setToken(access_token);
      return true;
    } catch (e) {
      console.error("Login error", e);
      return false;
    }
  };

  const register = async (email: string, mdp: string) => {
    try {
      await api.post('/inscription', { email, mot_de_passe: mdp });
      return await login(email, mdp);
    } catch (e) {
      console.error("Register error", e);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

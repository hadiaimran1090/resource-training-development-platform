import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../api/authApi';
import { authApi } from '../api/authApi';
import { setMemoryToken } from '../api/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial session load check
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await authApi.login(email, password);
    
    // Store token strictly in memory
    setMemoryToken(data.token);
    setToken(data.token);
    setUser(data.user);
    
    return data.user;
  };

  const logout = () => {
    setMemoryToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

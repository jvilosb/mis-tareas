import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  needsSetup: boolean;
  loading: boolean;
  users: User[];
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  setup: (username: string, name: string, password: string, color?: string, avatar?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const checkSession = async () => {
    try {
      const data = await api.auth.me();
      setNeedsSetup(data.needsSetup);
      setUser(data.user);
      if (data.user) {
        loadUsers();
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.auth.getUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Error al cargar lista de familiares:', err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (username: string, password: string, rememberMe = true) => {
    const data = await api.auth.login({ username, password, rememberMe });
    setUser(data.user);
    await loadUsers();
  };

  const setup = async (username: string, name: string, password: string, color?: string, avatar?: string) => {
    const data = await api.auth.setup({ username, name, password, color, avatar });
    setUser(data.user);
    setNeedsSetup(false);
    await loadUsers();
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        needsSetup,
        loading,
        users,
        login,
        setup,
        logout,
        refreshUsers: loadUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

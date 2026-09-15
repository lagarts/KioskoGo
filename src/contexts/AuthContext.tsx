import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'admin@kioskogo.com',
  name: 'Administrador',
  role: 'admin',
  business_id: 'demo-business-id',
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('kioskogo_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('kioskogo_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, _password: string) => {
    const mockUser: User = {
      ...DEMO_USER,
      email,
      name: email.split('@')[0],
    };
    setUser(mockUser);
    localStorage.setItem('kioskogo_user', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, _password: string, name: string) => {
    const mockUser: User = {
      ...DEMO_USER,
      email,
      name,
    };
    setUser(mockUser);
    localStorage.setItem('kioskogo_user', JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('kioskogo_user');
    localStorage.removeItem('kioskogo_cash_register');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

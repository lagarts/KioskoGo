import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const profileCache = new Map<string, Promise<User>>();

async function getOrCreateProfile(authUser: SupabaseUser): Promise<User> {
  const { data, error } = await supabase.rpc('get_or_create_profile');
  if (error) {
    if (error.message.includes('get_or_create_profile')) {
      throw new Error(
        'El sistema no está actualizado: ejecutá el SQL supabase/get_or_create_profile.sql en Supabase.'
      );
    }
    throw new Error(error.message);
  }
  const profile = (Array.isArray(data) ? data[0] : data) as User | undefined;
  if (!profile || profile.id !== authUser.id) {
    throw new Error('No se pudo cargar el perfil.');
  }
  return profile;
}

function loadProfile(authUser: SupabaseUser): Promise<User> {
  const cached = profileCache.get(authUser.id);
  if (cached) return cached;
  const promise = getOrCreateProfile(authUser).catch((err) => {
    profileCache.delete(authUser.id);
    throw err;
  });
  profileCache.set(authUser.id, promise);
  return promise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await loadProfile(session.user);
          if (mountedRef.current) setUser(profile);
        } catch (err) {
          console.error('Error cargando perfil:', err);
        }
      }
      if (mountedRef.current) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user)
          .then((profile) => {
            if (mountedRef.current) setUser(profile);
          })
          .catch((err) => console.error('Error cargando perfil:', err));
      } else if (mountedRef.current) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await loadProfile(data.user);
      setUser(profile);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.session && data.user) {
      const profile = await loadProfile(data.user);
      setUser(profile);
      setLoading(false);
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  };

  const signOut = async () => {
    profileCache.clear();
    setUser(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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

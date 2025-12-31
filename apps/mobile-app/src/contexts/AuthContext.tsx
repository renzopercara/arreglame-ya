'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client';
import { StorageAdapter } from '@/lib/adapters/storage';
import { ME_QUERY } from '@/graphql/queries';
import { toast } from 'sonner';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  activeRole?: 'CLIENT' | 'PROVIDER';
  status?: string;
  avatar?: string;
  phone?: string;
  rating?: number;
  loyaltyPoints?: number;
  balance?: number;
  totalJobs?: number;
  workerStatus?: string;
  kycStatus?: string;
  bio?: string;
  currentPlan?: string;
  mercadopagoCustomerId?: string;
  mercadopagoAccessToken?: string;
  mercadopagoEmail?: string;
}

interface AuthContextValue {
  // State
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  isBootstrapping: boolean;
  
  // Methods
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                                  CONTEXT                                   */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                                  PROVIDER                                  */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [fetchMe] = useLazyQuery<{ me: User }>(ME_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  /* --------------------------- SESSION RESTORATION --------------------------- */
  
  const restoreSession = useCallback(async () => {
    try {
      // Get token from storage
      const storedToken = await StorageAdapter.get('auth.token');
      
      if (!storedToken) {
        setIsBootstrapping(false);
        return;
      }

      // Validate token by fetching user
      const { data, error } = await fetchMe();

      if (error || !data?.me) {
        // Invalid token - clear it
        await StorageAdapter.remove('auth.token');
        await StorageAdapter.remove('auth.user');
        setIsBootstrapping(false);
        return;
      }

      // Token is valid - restore session
      setAccessToken(storedToken);
      setUser(data.me);
      
      // Also persist user data
      await StorageAdapter.set('auth.user', JSON.stringify(data.me));
    } catch (err) {
      console.error('[AuthContext] Session restoration failed:', err);
      // Clear potentially corrupted data
      await StorageAdapter.remove('auth.token');
      await StorageAdapter.remove('auth.user');
    } finally {
      setIsBootstrapping(false);
    }
  }, [fetchMe]);

  /* ----------------------------- INITIALIZATION ----------------------------- */
  
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /* ------------------------------- LOGIN ------------------------------- */
  
  const login = useCallback(async (token: string, userData: User) => {
    try {
      // Store in state
      setAccessToken(token);
      setUser(userData);

      // Persist to storage
      await StorageAdapter.set('auth.token', token);
      await StorageAdapter.set('auth.user', JSON.stringify(userData));
    } catch (err) {
      console.error('[AuthContext] Login failed:', err);
      toast.error('Error al guardar la sesión');
      throw err;
    }
  }, []);

  /* ------------------------------- LOGOUT ------------------------------- */
  
  const logout = useCallback(async () => {
    try {
      // Clear state
      setAccessToken(null);
      setUser(null);

      // Clear storage
      await StorageAdapter.remove('auth.token');
      await StorageAdapter.remove('auth.user');

      // Redirect to home
      router.push('/');
      
      toast.success('Sesión cerrada correctamente');
    } catch (err) {
      console.error('[AuthContext] Logout failed:', err);
      toast.error('Error al cerrar sesión');
    }
  }, [router]);

  /* ---------------------------- UPDATE USER ---------------------------- */
  
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      
      // Persist to storage
      StorageAdapter.set('auth.user', JSON.stringify(updated)).catch(err => {
        console.error('[AuthContext] Failed to persist user update:', err);
      });
      
      return updated;
    });
  }, []);

  /* ---------------------------- REFRESH USER ---------------------------- */
  
  const refreshUser = useCallback(async () => {
    if (!accessToken) return;

    try {
      const { data, error } = await fetchMe();
      
      if (error || !data?.me) {
        // Session expired or invalid
        await logout();
        return;
      }

      setUser(data.me);
      await StorageAdapter.set('auth.user', JSON.stringify(data.me));
    } catch (err) {
      console.error('[AuthContext] Refresh user failed:', err);
    }
  }, [accessToken, fetchMe, logout]);

  /* ------------------------------- VALUE ------------------------------- */
  
  const value: AuthContextValue = {
    isAuthenticated: !!accessToken && !!user,
    accessToken,
    user,
    isBootstrapping,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                                    HOOK                                    */
/* -------------------------------------------------------------------------- */

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient } from '@apollo/client/react';
import { toast } from 'sonner';
import { useAuthStore, User } from '@/stores/authStore';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

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
  refetchUser: () => Promise<void>;
  switchRole: (activeRole: 'CLIENT' | 'PROVIDER') => Promise<void>;
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
  const apolloClient = useApolloClient();
  
  // Use Zustand store (BLOCK 2)
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const zustandLogin = useAuthStore((state) => state.login);
  const zustandLogout = useAuthStore((state) => state.logout);
  const zustandUpdateUser = useAuthStore((state) => state.updateUser);

  /* ------------------------------- LOGIN ------------------------------- */
  
  const login = useCallback(async (token: string, userData: User) => {
    try {
      // Store in Zustand (BLOCK 2)
      zustandLogin(token, userData);
    } catch (err) {
      console.error('[AuthContext] Login failed:', err);
      toast.error('Error al guardar la sesión');
      throw err;
    }
  }, [zustandLogin]);

  /* ------------------------------- LOGOUT ------------------------------- */
  
  const logout = useCallback(async () => {
    try {
      // Clear Zustand store (BLOCK 2)
      zustandLogout();

      // Clear Apollo cache (BLOCK 3)
      await apolloClient.clearStore();

      // Redirect to home
      router.push('/');
      
      toast.success('Sesión cerrada correctamente');
    } catch (err) {
      console.error('[AuthContext] Logout failed:', err);
      toast.error('Error al cerrar sesión');
    }
  }, [router, apolloClient, zustandLogout]);

  /* ---------------------------- UPDATE USER ---------------------------- */
  
  const updateUser = useCallback((updates: Partial<User>) => {
    zustandUpdateUser(updates);
  }, [zustandUpdateUser]);

  /* ---------------------------- REFRESH USER ---------------------------- */
  
  const refreshUser = useCallback(async () => {
    // Not needed anymore since we don't fetch /me on every load
    // This is kept for backward compatibility
  }, []);

  /* ---------------------------- REFETCH USER ---------------------------- */
  
  const refetchUser = useCallback(async () => {
    // Import needed at top of file
    const { ME_QUERY } = await import('@/graphql/queries');
    try {
      const result = await apolloClient.query({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });
      
      if (result.data?.me) {
        updateUser(result.data.me);
      }
    } catch (err) {
      console.error('[AuthContext] Refetch user failed:', err);
    }
  }, [apolloClient, updateUser]);

  /* ---------------------------- SWITCH ROLE ---------------------------- */
  
  const switchRole = useCallback(async (activeRole: 'CLIENT' | 'PROVIDER') => {
    const { SWITCH_ACTIVE_ROLE } = await import('@/graphql/queries');
    try {
      const result = await apolloClient.mutate({
        mutation: SWITCH_ACTIVE_ROLE,
        variables: { activeRole },
      });
      
      if (result.data?.switchActiveRole) {
        updateUser(result.data.switchActiveRole);
        toast.success(
          activeRole === 'PROVIDER' 
            ? 'Cambiado a modo Profesional' 
            : 'Cambiado a modo Cliente'
        );
      }
    } catch (err) {
      console.error('[AuthContext] Switch role failed:', err);
      toast.error('Error al cambiar de rol');
      throw err;
    }
  }, [apolloClient, updateUser]);

  /* ------------------------------- VALUE ------------------------------- */
  
  const value: AuthContextValue = {
    isAuthenticated,
    accessToken: token,
    user,
    isBootstrapping: !isHydrated, // Bootstrapping until hydrated
    login,
    logout,
    updateUser,
    refreshUser,
    refetchUser,
    switchRole,
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

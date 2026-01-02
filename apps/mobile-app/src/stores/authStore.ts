/**
 * Auth Store - Zustand with Persist Middleware
 * BLOCK 2: Persistent Session Management
 * 
 * Inspiration: MercadoLibre, Uber Web, Airbnb
 * - Single source of truth for auth state
 * - localStorage persistence
 * - Hydration flag to prevent UI flicker
 * - No unnecessary backend calls
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface User {
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

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHydrated: (hydrated: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*                                AUTH STORE                                  */
/* -------------------------------------------------------------------------- */

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      // Login action
      login: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      // Logout action
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      // Update user data
      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      // Set hydration flag
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated flag when rehydration completes
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ApolloProvider, useLazyQuery, useMutation } from "@apollo/client/react"; 
import { LocationProvider } from "@/contexts/LocationContext";
import { Toaster } from "sonner";
import { client } from "../../../../graphql/client";
import { ME_QUERY, LOGIN_MUTATION, REGISTER_MUTATION, SWITCH_ACTIVE_ROLE } from "@/graphql/queries";
import { StorageAdapter } from "@/lib/adapters/storage";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Backward compatibility - primary role
  roles: string[]; // New: Array of all roles user has
  currentRole: string; // New: Current primary role
  activeRole: string;
  status?: string;
  avatar?: string;
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
  mustAcceptTerms: boolean;
  isEmailVerified?: boolean;
  isKycVerified?: boolean;
}

/* GraphQL Response Types */
interface MeQueryResponse {
  me: User;
}

interface LoginMutationResponse {
  login: {
    accessToken: string;
    user: User;
  };
}

interface LoginMutationVariables {
  email: string;
  password: string;
  role: string;
}

interface RegisterMutationResponse {
  register: {
    accessToken: string;
    user: User;
  };
}

interface RegisterMutationVariables {
  email: string;
  password: string;
  name: string;
  role: string;
  termsAccepted: boolean;
  termsVersion: string;
  termsDate: string;
  userAgent: string;
}

interface SwitchActiveRoleMutationResponse {
  switchActiveRole: {
    id: string;
    activeRole: string;
    name: string;
    role: string;
    roles: string[];
    currentRole: string;
  };
}

interface SwitchActiveRoleMutationVariables {
  activeRole: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isBootstrapping: boolean;
  hasWorkerRole: boolean;
  hasClientRole: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string, termsAccepted: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  switchRole: (activeRole: 'CLIENT' | 'WORKER') => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* AUTH CONTEXT                                                               */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  
  // Guard to prevent duplicate bootstrap calls in React 18 Strict Mode
  const isBootstrappingRef = useRef(false);
  const hasBootstrappedRef = useRef(false);

  const [fetchMe, { loading: meLoading, data: meData, error: meError }] = useLazyQuery<MeQueryResponse>(ME_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [loginMutation, { loading: loginLoading }] = useMutation<LoginMutationResponse, LoginMutationVariables>(LOGIN_MUTATION, {
    onError: (error) => {
      // Errors will be thrown to the calling function
      // This ensures we don't leave the app in a partially authenticated state
      console.error('Login mutation error:', error);
    }
  });
  
  const [registerMutation, { loading: registerLoading }] = useMutation<RegisterMutationResponse, RegisterMutationVariables>(REGISTER_MUTATION, {
    onError: (error) => {
      // Errors will be thrown to the calling function
      console.error('Register mutation error:', error);
    }
  });

  const [switchRoleMutation, { loading: switchRoleLoading }] = useMutation<SwitchActiveRoleMutationResponse, SwitchActiveRoleMutationVariables>(SWITCH_ACTIVE_ROLE, {
    onError: (error) => {
      console.error('Switch role mutation error:', error);
    }
  });

  // Handle fetchMe response via useEffect
  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
      setIsBootstrapping(false);
    }
  }, [meData]);

  // Handle fetchMe error via useEffect
  useEffect(() => {
    if (meError) {
      // Gracefully handle AbortError - it's expected when requests are cancelled
      // (e.g., during React Strict Mode remounts or component unmounts)
      if (meError.name === 'AbortError' || meError.message?.includes('abort')) {
        // Silently ignore - this is normal behavior
        return;
      }
      console.error('Error fetching user:', meError);
      
      // Clear invalid token on authentication failure
      StorageAdapter.remove('ay_auth_token').catch(err => {
        console.error('Error clearing token:', err);
      });
      
      setUser(null);
      setIsBootstrapping(false);
    }
  }, [meError]);

  // Bootstrap authentication exactly once, safe for React 18 Strict Mode
  useEffect(() => {
    // Guard against duplicate execution:
    // - isBootstrappingRef: prevents concurrent calls (e.g., multiple triggers)
    // - hasBootstrappedRef: prevents re-execution after completion (e.g., Strict Mode remount)
    if (isBootstrappingRef.current || hasBootstrappedRef.current) {
      return;
    }

    isBootstrappingRef.current = true;

    const initAuth = async () => {
      try {
        const token = await StorageAdapter.get('ay_auth_token');
        if (token) {
          await fetchMe();
        } else {
          setIsBootstrapping(false);
        }
      } catch (error) {
        console.error('Error during auth bootstrap:', error);
        setIsBootstrapping(false);
      } finally {
        hasBootstrappedRef.current = true;
        isBootstrappingRef.current = false;
      }
    };

    initAuth();
  }, []); // Empty dependency array - run once on mount

  const login = useCallback(async (email: string, password: string, role: string) => {
    const { data } = await loginMutation({
      variables: { email, password, role },
    });

    if (data?.login) {
      await StorageAdapter.set('ay_auth_token', data.login.accessToken);
      setUser(data.login.user);
      await client.resetStore();
    }
  }, [loginMutation]);

  const register = useCallback(async (email: string, password: string, name: string, role: string, termsAccepted: boolean) => {
    const { data } = await registerMutation({
      variables: {
        email,
        password,
        name,
        role,
        termsAccepted,
        termsVersion: '1.0',
        termsDate: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    });

    if (data?.register) {
      await StorageAdapter.set('ay_auth_token', data.register.accessToken);
      setUser(data.register.user);
      await client.resetStore();
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await StorageAdapter.remove('ay_auth_token');
    setUser(null);
    await client.clearStore();
  }, []);

  const refetchUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const switchRole = useCallback(async (activeRole: 'CLIENT' | 'WORKER') => {
    await switchRoleMutation({
      variables: { activeRole },
    });

    // Refetch full user data after role switch
    await fetchMe();
    await client.resetStore();
  }, [switchRoleMutation, fetchMe]);

  // Determine user capabilities based on roles array (multi-role support)
  const hasWorkerRole = user?.roles?.includes('WORKER') || user?.roles?.includes('ADMIN') || user?.role === 'WORKER' || user?.role === 'ADMIN';
  const hasClientRole = user?.roles?.includes('CLIENT') || user?.roles?.includes('ADMIN') || true; // All users can act as clients

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading: meLoading || loginLoading || registerLoading || switchRoleLoading,
    isBootstrapping,
    hasWorkerRole,
    hasClientRole,
    login,
    register,
    logout,
    refetchUser,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApolloProvider client={client}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </ApolloProvider>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PROVIDERS COMPONENT                                                   */
/* -------------------------------------------------------------------------- */

export function Providers({ children }: { children: React.ReactNode }) {
  if (!client) {
    return <div className="p-4 text-red-500">Error: Apollo Client no inicializado</div>;
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <Toaster position="top-center" richColors duration={4000} />
        
        <style dangerouslySetInnerHTML={{ __html: `
          .sonner-toast {
            border-radius: 1.5rem !important;
            font-family: ui-sans-serif, system-ui, sans-serif !important;
            padding: 1rem 1.5rem !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
          }
        `}} />

        {children}
      </LocationProvider>
    </AuthProvider>
  );
}
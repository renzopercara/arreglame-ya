"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ApolloProvider, useLazyQuery, useMutation } from "@apollo/client/react"; 
import { LocationProvider } from "@/contexts/LocationContext";
import { Toaster } from "sonner";
import { client } from "../../../../graphql/client";
import { ME_QUERY, LOGIN_MUTATION } from "@/graphql/queries";
import { StorageAdapter } from "@/lib/adapters/storage";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
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

  const [fetchMe, { loading: meLoading }] = useLazyQuery(ME_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.me) {
        setUser(data.me);
      }
      setIsBootstrapping(false);
    },
    onError: (error) => {
      console.error('Error fetching user:', error);
      setUser(null);
      setIsBootstrapping(false);
    },
  });

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);

  useEffect(() => {
    const initAuth = async () => {
      const token = await StorageAdapter.get('ay_auth_token');
      if (token) {
        await fetchMe();
      } else {
        setIsBootstrapping(false);
      }
    };
    initAuth();
  }, [fetchMe]);

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

  const logout = useCallback(async () => {
    await StorageAdapter.remove('ay_auth_token');
    setUser(null);
    await client.clearStore();
  }, []);

  const refetchUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading: meLoading || loginLoading,
    isBootstrapping,
    login,
    logout,
    refetchUser,
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
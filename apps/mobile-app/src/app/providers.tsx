'use client';

import React, { useMemo } from 'react';
import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ApolloProvider } from '@apollo/client/react';
import { LocationProvider } from '@/contexts/LocationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { errorLink } from '@/lib/apollo/errorLink';
import { StorageAdapter } from '@/lib/adapters/storage';

// Endpoint GraphQL unificado (NestJS corre en 3001 por defecto)
// Usa NEXT_PUBLIC_GRAPHQL_URL para apuntar exactamente a /graphql
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

// Auth link - Adds Authorization header to all requests
const authLink = setContext(async (_, { headers }) => {
  // Get token from storage
  const token = await StorageAdapter.get('auth.token');

  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const httpLink = new HttpLink({ 
  uri: API_URL,
  credentials: 'include', // Incluye cookies para autenticación
});

const client = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <LocationProvider>
          {/* Sonner Toaster - Mobile-first positioning */}
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                marginTop: '60px', // Evita que cubra el header
              },
              className: 'sonner-toast',
            }}
            richColors
            closeButton
            duration={4000}
          />
          {children}
        </LocationProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}

'use client';

import React from 'react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { LocationProvider } from '@/contexts/LocationContext';
import { Toaster } from 'sonner';
import { errorLink } from '@/lib/apollo/errorLink';

// Endpoint GraphQL unificado (NestJS corre en 3001 por defecto)
// Usa NEXT_PUBLIC_GRAPHQL_URL para apuntar exactamente a /graphql
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

const httpLink = new HttpLink({ 
  uri: API_URL,
  credentials: 'include', // Incluye cookies para autenticación
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
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
    </ApolloProvider>
  );
}

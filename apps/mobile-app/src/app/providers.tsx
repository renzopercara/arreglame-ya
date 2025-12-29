'use client';

import React from 'react';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { LocationProvider } from '@/contexts/LocationContext';

// Endpoint GraphQL unificado (NestJS corre en 3001 por defecto)
// Usa NEXT_PUBLIC_GRAPHQL_URL para apuntar exactamente a /graphql
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

const client = new ApolloClient({
  link: new HttpLink({ uri: API_URL }),
  cache: new InMemoryCache(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <LocationProvider>
        {children}
      </LocationProvider>
    </ApolloProvider>
  );
}

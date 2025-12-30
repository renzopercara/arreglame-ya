'use client';

import React from 'react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { ApolloProvider } from '@apollo/client/react';
import { LocationProvider } from '@/contexts/LocationContext';

// Endpoint GraphQL unificado (NestJS corre en 3001 por defecto)
// Usa NEXT_PUBLIC_GRAPHQL_URL para apuntar exactamente a /graphql
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

// Link para manejo de errores - Fase 5 del runbook: Robustez del Apollo Client
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}, Operation: ${operation.operationName}`
      )
    );
  }

  if (networkError) {
    console.error(
      `[Network Error]: ${networkError.message}`,
      `\nAPI URL: ${API_URL}`,
      `\nOperation: ${operation.operationName}`,
      `\n\n⚠️ TROUBLESHOOTING:`,
      `\n1. Verifica que el backend esté corriendo: npm run start:api`,
      `\n2. Confirma el puerto en: http://localhost:3001/graphql`,
      `\n3. Revisa las variables de entorno en .env.local`
    );
  }
});

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
        {children}
      </LocationProvider>
    </ApolloProvider>
  );
}

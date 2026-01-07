import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { StorageAdapter } from '../lib/adapters/storage';

const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
const WS_URL = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || API_URL.replace(/^http/, 'ws');

const authLink = setContext(async (_, { headers }) => {
  const token = await StorageAdapter.get('ay_auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const httpLink = new HttpLink({ uri: API_URL });

const wsLink = typeof window !== "undefined" ? new GraphQLWsLink(createClient({
  url: WS_URL,
  connectionParams: async () => {
    const token = await StorageAdapter.get('ay_auth_token');
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  },
  retryAttempts: 5,
})) : null;

const splitLink = typeof window !== "undefined" && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
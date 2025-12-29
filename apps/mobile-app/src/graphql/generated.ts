import { QueryHookOptions, useQuery } from '@apollo/client/react';
import { GET_SERVICE } from './queries';

// Shim temporal hasta que se ejecute GraphQL Codegen
export function useGetServiceQuery(options: QueryHookOptions<any, { id: string }>) {
  return useQuery<any, { id: string }>(GET_SERVICE, options);
}

"use client";

import { gql } from "@apollo/client";
import type { Service } from "@/components/ServiceCard";
import { useQuery } from "@apollo/client/react";

export const GET_SERVICES = gql`
  query GetServices($category: String, $query: String, $location: String) {
    getServices(category: $category, query: $query, location: $location) {
      id
      title
      provider
      price
      category
      imageUrl
    }
  }
`;

interface UseServicesOptions {
  category?: string | null;
  query?: string;
  location?: string;
}

export default function useServices(options?: UseServicesOptions) {
  const { data, loading, error, refetch } = useQuery<{ getServices: Service[] }>(GET_SERVICES, {
    fetchPolicy: "cache-and-network",
    variables: {
      category: options?.category || undefined,
      query: options?.query || undefined,
      location: options?.location || undefined,
    },
  });

  const services = data?.getServices ?? [];
  const friendlyError = error ? error.message : null;

  return { services, loading, error: friendlyError, refetch };
}
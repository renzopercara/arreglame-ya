"use client";

import { gql } from "@apollo/client";
import type { Service } from "@/components/ServiceCard";
import { useQuery } from "@apollo/client/react";

export const GET_SERVICES = gql`
  query GetServices(
    $category: String
    $query: String
    $location: String
    $latitude: Float
    $longitude: Float
    $radiusKm: Int
  ) {
    getServices(
      category: $category
      query: $query
      location: $location
      latitude: $latitude
      longitude: $longitude
      radiusKm: $radiusKm
    ) {
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
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export default function useServices(options?: UseServicesOptions) {
  const { data, loading, error, refetch } = useQuery<{ getServices: Service[] }>(GET_SERVICES, {
    fetchPolicy: "cache-and-network",
    variables: {
      category: options?.category || undefined,
      query: options?.query || undefined,
      location: options?.location || undefined,
      latitude: options?.latitude || undefined,
      longitude: options?.longitude || undefined,
      radiusKm: options?.radiusKm || undefined,
    },
  });

  return { 
    services: data?.getServices ?? [], 
    loading, 
    error: error ? error.message : null, 
    refetch 
  };
}
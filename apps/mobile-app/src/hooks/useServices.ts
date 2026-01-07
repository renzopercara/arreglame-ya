"use client";

import { gql } from "@apollo/client";
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

interface JobFromAPI {
  id: string;
  title: string | null;
  provider: string | null;
  price: any;
  category: string | null;
  imageUrl: string | null;
}

export interface Service {
  id: string;
  title: string;
  provider: string;
  price: any;
  category: string;
  imageUrl: string;
  image: string;
  rating?: number;
}

interface UseServicesOptions {
  category?: string | null;
  query?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export default function useServices(options?: UseServicesOptions) {
  const { data, loading, error, refetch } = useQuery<{ getServices: JobFromAPI[] }>(GET_SERVICES, {
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

  const services: Service[] = (data?.getServices ?? []).map((job) => ({
    id: job.id,
    title: job.title || 'Sin título',
    provider: job.provider || 'Proveedor',
    price: job.price,
    category: job.category || 'General',
    imageUrl: job.imageUrl || '',
    image: job.imageUrl || '',
    rating: undefined,
  }));

  return { 
    services, 
    loading, 
    error: error ? error.message : null, 
    refetch 
  };
}
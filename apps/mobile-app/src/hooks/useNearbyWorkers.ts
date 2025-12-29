"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { ServiceMapMarker } from "@/components/ServiceMap";

// GraphQL query for nearby workers/services
const GET_NEARBY_WORKERS = gql`
  query GetNearbyWorkers(
    $latitude: Float!
    $longitude: Float!
    $radiusKm: Int
  ) {
    getServices(
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

// Interface for the API response
interface Worker {
  id: string;
  title: string;
  provider: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface GetNearbyWorkersResponse {
  getServices: Worker[];
}

interface UseNearbyWorkersOptions {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  skip?: boolean;
}

interface UseNearbyWorkersResult {
  workers: Worker[];
  markers: ServiceMapMarker[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch nearby workers from the API
 * 
 * @param options - Configuration options including latitude, longitude, and radius
 * @returns Object containing workers data, markers for map, loading state, error state, and refetch function
 */
export default function useNearbyWorkers(
  options: UseNearbyWorkersOptions = {}
): UseNearbyWorkersResult {
  const { latitude, longitude, radiusKm = 50, skip = false } = options;

  // Skip query if coordinates are not available or explicitly skipped
  const shouldSkip = skip || !latitude || !longitude;

  const { data, loading, error, refetch } = useQuery<GetNearbyWorkersResponse>(
    GET_NEARBY_WORKERS,
    {
      variables: {
        latitude,
        longitude,
        radiusKm,
      },
      skip: shouldSkip,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  // Extract workers from response
  const workers = data?.getServices ?? [];

  // Map workers to ServiceMapMarker format for the map component
  const markers = useMemo<ServiceMapMarker[]>(() => {
    if (!latitude || !longitude || !workers.length) {
      return [];
    }

    // Since the API doesn't return lat/lng for each worker in the Service type,
    // we'll distribute them around the user's location in a circular pattern
    // This is a temporary solution until the API provides actual worker coordinates
    return workers.map((worker, index) => {
      const angle = (index / workers.length) * 2 * Math.PI;
      const radius = 0.01 + (index % 3) * 0.005; // Vary radius slightly
      
      return {
        id: worker.id,
        lat: latitude + radius * Math.cos(angle),
        lng: longitude + radius * Math.sin(angle),
        title: worker.title,
        price: worker.price,
        provider: worker.provider,
        imageUrl: worker.imageUrl,
      };
    });
  }, [workers, latitude, longitude]);

  // Format error message for user-friendly display
  const friendlyError = error
    ? "No pudimos cargar trabajadores cercanos. Intentá nuevamente."
    : null;

  return {
    workers,
    markers,
    loading,
    error: friendlyError,
    refetch,
  };
}

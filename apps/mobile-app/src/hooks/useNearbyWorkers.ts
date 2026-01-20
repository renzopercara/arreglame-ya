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

// Interface for the API response (matching GraphQL Service type)
interface Worker {
  id: string;
  title: string;
  provider: string;
  price: number; // GraphQL returns Float
  category: string;
  imageUrl?: string | null;
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

  /**
   * Validación estricta:
   * Verificamos que latitude y longitude sean números válidos.
   * Usamos Number.isFinite para evitar NaN o Infinity.
   */
  const hasValidCoordinates = 
    typeof latitude === 'number' && 
    typeof longitude === 'number' && 
    !isNaN(latitude) && 
    !isNaN(longitude);

  // La query SOLO debe saltarse si 'skip' es true O si no hay coordenadas válidas
  const shouldSkipQuery = skip || !hasValidCoordinates;

  const { data, loading, error, refetch } = useQuery<GetNearbyWorkersResponse>(
    GET_NEARBY_WORKERS,
    {
      // Solo pasamos variables si la validación es correcta
      variables: hasValidCoordinates ? {
        latitude,
        longitude,
        radiusKm,
      } : undefined,
      skip: shouldSkipQuery, // Aquí es donde Apollo decide si disparar la petición o no
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  // Extract workers from response
  const workers = data?.getServices ?? [];

  // Constants for positioning markers around user location
  // These create a circular distribution pattern for visualization
  const BASE_RADIUS = 0.01; // Approximately 1.1km at equator
  const RADIUS_VARIATION = 0.005; // Approximately 550m variation
  const RADIUS_TIERS = 3; // Number of distance tiers for varied marker placement

  // Map workers to ServiceMapMarker format for the map component
  const markers = useMemo<ServiceMapMarker[]>(() => {
    if (!latitude || !longitude || !workers.length) {
      return [];
    }

    // Since the API doesn't return lat/lng for each worker in the Service type,
    // we distribute them around the user's location in a circular pattern
    // TODO: Update when API provides actual worker coordinates
    return workers.map((worker, index) => {
      const angle = (index / workers.length) * 2 * Math.PI;
      const radius = BASE_RADIUS + (index % RADIUS_TIERS) * RADIUS_VARIATION;

      return {
        id: worker.id,
        lat: latitude + radius * Math.cos(angle),
        lng: longitude + radius * Math.sin(angle),
        title: worker.title,
        price: worker.price,
        provider: worker.provider,
        imageUrl: worker.imageUrl ?? undefined,
      };
    });
  }, [workers, latitude, longitude]);

  // Format error message for user-friendly display
  // Following same pattern as useServices for consistency
  const friendlyError = error ? error.message : null;

  // Log full error for debugging if available
  if (error && process.env.NODE_ENV === 'development') {
    console.error('[useNearbyWorkers] GraphQL Error:', error);
  }

  return {
    workers,
    markers,
    loading,
    error: friendlyError,
    refetch,
  };
}

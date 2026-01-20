"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";

/**
 * Query GraphQL para obtener servicios.
 * Nota: Aunque en el esquema son opcionales, el hook forzará su presencia.
 */
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

// --- Interfaces ---

interface JobFromAPI {
  id: string;
  title: string | null;
  provider: string | null;
  price: number | { total?: number; currency?: string } | null;
  category: string | null;
  imageUrl: string | null;
}

export interface Service {
  id: string;
  title: string;
  provider: string;
  price: number | { total?: number; currency?: string } | null;
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

// --- Hook Principal ---

export default function useServices(options?: UseServicesOptions) {
  /**
   * Validación estricta de los 4 campos requeridos.
   * Usamos 'Number.isFinite' para asegurar que las coordenadas sean números válidos y no NaN.
   */
  const hasRequiredParams = useMemo(() => {
    const hasLocation = !!options?.location && options.location.trim() !== "";
    const hasLat = typeof options?.latitude === "number" && Number.isFinite(options.latitude);
    const hasLng = typeof options?.longitude === "number" && Number.isFinite(options.longitude);
    const hasRadius = typeof options?.radiusKm === "number" && options.radiusKm > 0;

    return hasLocation && hasLat && hasLng && hasRadius;
  }, [options]);

  /**
   * Construcción de variables para la query.
   * Solo se generan si la validación anterior es exitosa.
   */
  const serviceVariables = useMemo(() => {
    if (!hasRequiredParams) return {};

    return {
      category: options?.category || undefined,
      query: options?.query || undefined,
      location: options?.location,
      latitude: options?.latitude,
      longitude: options?.longitude,
      radiusKm: options?.radiusKm,
    };
  }, [options, hasRequiredParams]);

  const { data, loading, error, refetch } = useQuery<
    { getServices: JobFromAPI[] },
    UseServicesOptions
  >(GET_SERVICES, {
    fetchPolicy: "cache-and-network",
    variables: serviceVariables,
    // BLOQUEO CRÍTICO: Si no hay parámetros, skip es true y no hay petición.
    skip: !hasRequiredParams,
    notifyOnNetworkStatusChange: true,
  });

  /**
   * Transformación de datos de la API al modelo de la UI.
   */
  const services: Service[] = useMemo(() => {
    const rawServices = data?.getServices ?? [];
    return rawServices.map((job) => ({
      id: job.id,
      title: job.title || "Sin título",
      provider: job.provider || "Proveedor",
      price: job.price,
      category: job.category || "General",
      imageUrl: job.imageUrl || "",
      image: job.imageUrl || "",
      rating: undefined,
    }));
  }, [data]);

  return {
    services,
    // Si la query está saltada por falta de datos, loading debe ser false.
    loading: hasRequiredParams ? loading : false,
    error: error ? error.message : null,
    refetch,
  };
}
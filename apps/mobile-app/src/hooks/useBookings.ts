"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Obtiene trabajos cercanos para simular reservas del usuario
const NEARBY_JOBS = gql`
  query NearbyJobs($lat: Float!, $lng: Float!) {
    nearbyJobs(lat: $lat, lng: $lng) {
      id
      status
      description
      latitude
      longitude
      address
      gardenImageBefore
      createdAt
      price { total }
    }
  }
`;

export type Booking = {
  id: string;
  serviceId: string;
  title: string;
  price: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "in_progress";
  ts: number;
  window: string;
  location: string;
  image?: string | null;
};

function mapStatus(s: string): Booking["status"] {
  switch (s) {
    case "IN_PROGRESS": return "in_progress";
    case "COMPLETED": return "completed";
    case "CANCELLED": return "cancelled";
    case "ACCEPTED": return "confirmed";
    default: return "pending";
  }
}

export default function useBookings() {
  // Usa coordenadas fijas por ahora; puedes inyectar las reales desde el estado global
  const variables = { lat: -34.6037, lng: -58.3816 };
  const { data, loading, error, refetch } = useQuery<{ nearbyJobs: any[] }>(NEARBY_JOBS, { variables, fetchPolicy: "cache-and-network" });

  const bookings: Booking[] = (data?.nearbyJobs ?? []).map((j: any) => ({
    id: j.id,
    serviceId: j.id,
    title: j.description || "Servicio",
    price: j.price?.total ? `$${j.price.total}` : "$0",
    status: mapStatus(j.status),
    ts: j.createdAt ? Date.parse(j.createdAt) : Date.now(),
    window: "—",
    location: j.address || `${j.latitude}, ${j.longitude}`,
    image: j.gardenImageBefore || null,
  }));

  return { bookings, loading, error, refetch };
}

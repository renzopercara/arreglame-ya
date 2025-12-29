"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoService } from "@/lib/adapters/geo";

export type LocationStatus = "idle" | "pending" | "granted" | "denied" | "error";

interface UseLocationResult {
  status: LocationStatus;
  lat?: number;
  lng?: number;
  city?: string;
  neighborhood?: string;
  error?: string;
  setManualCity: (city: string) => void;
  refresh: () => void;
}

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export default function useLocation(): UseLocationResult {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [neighborhood, setNeighborhood] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const reverseGeocode = async (latitude: number, longitude: number) => {
    if (!apiKey) {
      setError("Falta la API key de Google Maps");
      return;
    }
    try {
      const url = `${GEOCODE_URL}?latlng=${latitude},${longitude}&key=${apiKey}`;
      const res = await fetch(url);
      const json = await res.json();
      const result = json.results?.[0];
      if (!result) return;

      // Parse address components
      const components: Array<{ long_name: string; short_name: string; types: string[] }> = result.address_components || [];
      const locality = components.find(c => c.types.includes("locality"))?.long_name;
      const sublocality = components.find(c => c.types.includes("sublocality_level_1"))?.long_name;
      const neighborhoodComp = components.find(c => c.types.includes("neighborhood"))?.long_name;

      setCity(locality || sublocality || undefined);
      setNeighborhood(neighborhoodComp || undefined);
    } catch (e: any) {
      setError(e.message || "Error en geocoding");
    }
  };

  const obtain = async () => {
    setStatus("pending");
    setError(undefined);
    try {
      const pos = await GeoService.getCurrentPosition();
      setLat(pos.lat);
      setLng(pos.lng);
      setStatus("granted");
      await reverseGeocode(pos.lat, pos.lng);
    } catch (e: any) {
      const msg = e.message || "Error obteniendo ubicación";
      setError(msg);
      // Try to detect permission state
      const p = await GeoService.checkPermissions();
      setStatus(p === "granted" ? "error" : p === "denied" ? "denied" : "error");
    }
  };

  useEffect(() => {
    obtain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManualCity = (c: string) => {
    setCity(c);
    setStatus("granted");
  };

  const refresh = () => obtain();

  return { status, lat, lng, city, neighborhood, error, setManualCity, refresh };
}

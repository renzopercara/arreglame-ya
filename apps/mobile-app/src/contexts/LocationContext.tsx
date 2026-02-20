"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { GeoService, GeoAddress } from "@/lib/adapters/geo";
import { ENTRE_RIOS_CITIES, DEFAULT_CITY, findCityByName, City } from "@/constants/cities";

export type LocationStatus = "loading" | "gps" | "manual" | "error";

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface LocationContextValue {
  status: LocationStatus;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  city?: City;
  address?: GeoAddress;
  error?: string;
  setManualCity: (cityName: string) => void;
  setManualCoords: (lat: number, lng: number, label?: string) => void;
  searchAddress: (query: string) => Promise<NominatimResult[]>;
  refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

/**
 * Forward geocoding via Nominatim OSM API.
 * Returns an array of search results (max 5).
 */
async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      // User-Agent is required by Nominatim's usage policy
      headers: { "User-Agent": "ArreglameYa/1.0 (soporte@arreglameya.com)" },
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [status, setStatus] = useState<LocationStatus>("loading");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [cityName, setCityName] = useState<string | undefined>();
  const [city, setCity] = useState<City | undefined>();
  const [address, setAddress] = useState<GeoAddress | undefined>();
  const [error, setError] = useState<string | undefined>();

  const tryGPSLocation = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      // Check permissions first
      const permission = await GeoService.checkPermissions();
      
      if (permission === "denied") {
        // If denied, immediately fall back to manual
        setStatus("manual");
        setCityName(DEFAULT_CITY.name);
        setCity(DEFAULT_CITY);
        setLatitude(DEFAULT_CITY.lat);
        setLongitude(DEFAULT_CITY.lng);
        return;
      }

      // Try to get GPS position
      const position = await GeoService.getCurrentPosition();
      setLatitude(position.lat);
      setLongitude(position.lng);
      setStatus("gps");
      
      // Reverse geocode to get address
      try {
        const geoAddress = await GeoService.reverseGeocode(position.lat, position.lng);
        setAddress(geoAddress);
        
        // Try to find matching city from our list
        if (geoAddress.city) {
          const matchedCity = findCityByName(geoAddress.city);
          if (matchedCity) {
            setCityName(matchedCity.name);
            setCity(matchedCity);
          } else {
            setCityName(geoAddress.city);
          }
        } else {
          setCityName(DEFAULT_CITY.name);
          setCity(DEFAULT_CITY);
        }
      } catch (geocodeError) {
        console.error("[LocationProvider] Reverse geocoding failed:", geocodeError);
        // Still set default city even if geocoding fails
        setCityName(DEFAULT_CITY.name);
        setCity(DEFAULT_CITY);
      }

    } catch (err: any) {
      console.error("[LocationProvider] GPS failed:", err);
      setError(err.message || "No se pudo obtener la ubicación");
      
      // Fallback to manual selection
      setStatus("manual");
      setCityName(DEFAULT_CITY.name);
      setCity(DEFAULT_CITY);
      setLatitude(DEFAULT_CITY.lat);
      setLongitude(DEFAULT_CITY.lng);
    }
  }, []);

  // Initialize location on mount
  useEffect(() => {
    tryGPSLocation();
  }, [tryGPSLocation]);

  const setManualCity = useCallback((name: string) => {
    const selectedCity = findCityByName(name);
    if (selectedCity) {
      setCityName(selectedCity.name);
      setCity(selectedCity);
      setLatitude(selectedCity.lat);
      setLongitude(selectedCity.lng);
      setStatus("manual");
      setError(undefined);
    }
  }, []);

  /** Set location by coordinates with an optional display label */
  const setManualCoords = useCallback((lat: number, lng: number, label?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setStatus("manual");
    setError(undefined);
    if (label) {
      setCityName(label);
    }
  }, []);

  /** Forward geocoding search via Nominatim */
  const searchAddress = useCallback(nominatimSearch, []);

  const refreshLocation = useCallback(() => {
    tryGPSLocation();
  }, [tryGPSLocation]);

  const value: LocationContextValue = {
    status,
    latitude,
    longitude,
    cityName,
    city,
    address,
    error,
    setManualCity,
    setManualCoords,
    searchAddress,
    refreshLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within LocationProvider");
  }
  return context;
}

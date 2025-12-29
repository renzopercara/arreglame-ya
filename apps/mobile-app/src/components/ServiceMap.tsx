"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

// Dynamic import to avoid SSR issues with Leaflet
const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-600">Cargando mapa...</p>
      </div>
    </div>
  ),
});

export interface ServiceMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: number;
  provider: string;
  imageUrl?: string;
}

interface ServiceMapProps {
  center: { lat: number; lng: number };
  markers: ServiceMapMarker[];
  userLocation?: { lat: number; lng: number };
  showAccuracyCircle?: boolean;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
}

export default function ServiceMap({
  center,
  markers,
  userLocation,
  showAccuracyCircle = false,
  onMarkerClick,
  className = "w-full h-[500px]",
}: ServiceMapProps) {
  return (
    <div className={className}>
      <MapContent
        center={center}
        markers={markers}
        userLocation={userLocation}
        showAccuracyCircle={showAccuracyCircle}
        onMarkerClick={onMarkerClick}
      />
    </div>
  );
}

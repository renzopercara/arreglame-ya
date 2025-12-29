"use client";

import { MapPin } from "lucide-react";
import ServiceMap, { ServiceMapMarker } from "./ServiceMap";
import { useLocationContext } from "@/contexts/LocationContext";

export default function NearYou() {
  const { latitude, longitude, cityName } = useLocationContext();

  // Default to Argentina (Buenos Aires area) if no location available
  const defaultLat = -34.6037;
  const defaultLng = -58.3816;
  const mapCenter = {
    lat: latitude || defaultLat,
    lng: longitude || defaultLng,
  };

  // Example markers near the location
  const exampleMarkers: ServiceMapMarker[] = [
    {
      id: "demo-1",
      lat: mapCenter.lat + 0.01,
      lng: mapCenter.lng + 0.01,
      title: "Jardinería Premium",
      price: 2500,
      provider: "Juan Pérez",
      imageUrl: undefined,
    },
    {
      id: "demo-2",
      lat: mapCenter.lat - 0.015,
      lng: mapCenter.lng + 0.02,
      title: "Mantenimiento de Jardines",
      price: 1800,
      provider: "María González",
      imageUrl: undefined,
    },
    {
      id: "demo-3",
      lat: mapCenter.lat + 0.02,
      lng: mapCenter.lng - 0.01,
      title: "Poda y Limpieza",
      price: 1500,
      provider: "Carlos Rodríguez",
      imageUrl: undefined,
    },
  ];

  return (
    <section className="flex flex-col gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Servicios cerca de ti</h2>
          <p className="text-sm text-slate-600">
            {cityName ? `En ${cityName}` : "Encuentra ayuda en tu zona"}
          </p>
        </div>
      </div>

      {/* Real Leaflet Map */}
      <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-blue-200">
        <ServiceMap
          center={mapCenter}
          markers={exampleMarkers}
          userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
          showAccuracyCircle={false}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center gap-2 p-4 bg-white/60 rounded-xl">
        <MapPin className="w-5 h-5 text-blue-600" />
        <p className="text-sm text-slate-600">
          <strong className="text-blue-600">{exampleMarkers.length} trabajadores</strong> disponibles cerca de tu ubicación
        </p>
      </div>
    </section>
  );
}

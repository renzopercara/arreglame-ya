"use client";

import { MapPin, Loader, AlertCircle, RefreshCw } from "lucide-react";
import ServiceMap from "./ServiceMap";
import { useLocationContext } from "@/contexts/LocationContext";
import useNearbyWorkers from "@/hooks/useNearbyWorkers";

export default function NearYou() {
  const { latitude, longitude, cityName } = useLocationContext();

  // Default to Argentina (Buenos Aires area) if no location available
  const defaultLat = -34.6037;
  const defaultLng = -58.3816;
  const mapCenter = {
    lat: latitude || defaultLat,
    lng: longitude || defaultLng,
  };

  // Fetch nearby workers from API
  const { markers, loading, error, refetch } = useNearbyWorkers({
    latitude,
    longitude,
    radiusKm: 50,
  });

  // Loading state
  if (loading) {
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

        {/* Loading skeleton */}
        <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-blue-200 bg-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600">Cargando trabajadores cercanos...</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-white/60 rounded-xl">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Buscando trabajadores disponibles...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="flex flex-col gap-4 p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Error al cargar</h2>
            <p className="text-sm text-slate-600">
              {cityName ? `En ${cityName}` : "Encuentra ayuda en tu zona"}
            </p>
          </div>
        </div>

        <div className="w-full p-8 rounded-xl bg-white/60 border border-red-200 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <p className="text-base font-medium text-slate-800 mb-1">
              No pudimos cargar trabajadores cercanos
            </p>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar nuevamente
          </button>
        </div>
      </section>
    );
  }

  // Empty state
  if (markers.length === 0) {
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

        {/* Empty state map */}
        <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-blue-200">
          <ServiceMap
            center={mapCenter}
            markers={[]}
            userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
            showAccuracyCircle={false}
            className="w-full h-full"
          />
        </div>

        <div className="flex items-center gap-2 p-4 bg-white/60 rounded-xl">
          <MapPin className="w-5 h-5 text-slate-400" />
          <p className="text-sm text-slate-600">
            No hay trabajadores disponibles en esta zona
          </p>
        </div>
      </section>
    );
  }

  // Success state - show markers and counter
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
          markers={markers}
          userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
          showAccuracyCircle={false}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center gap-2 p-4 bg-white/60 rounded-xl">
        <MapPin className="w-5 h-5 text-blue-600" />
        <p className="text-sm text-slate-600">
          <strong className="text-blue-600">{markers.length} trabajadores</strong> disponibles cerca de tu ubicación
        </p>
      </div>
    </section>
  );
}

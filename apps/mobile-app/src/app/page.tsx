"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CategoryGrid from "@/components/CategoryGrid";
import WelcomeHeader from "@/components/WelcomeHeader";
import FakeSearchBar from "@/components/FakeSearchBar";
import FeaturedServices from "@/components/FeaturedServices";
import NearYou from "@/components/NearYou";
import LocationSelector from "@/components/LocationSelector";
import ServiceMap from "@/components/ServiceMap";
import { ServiceMapMarker } from "@/components/ServiceMap";
import useServices from "@/hooks/useServices";
import { useLocationContext } from "@/contexts/LocationContext";
import { Map, List } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { status: locStatus, latitude, longitude, cityName } = useLocationContext();
  const [showMap, setShowMap] = useState(false);
  
  const { services, loading, refetch } = useServices({
    location: cityName,
    latitude,
    longitude,
    radiusKm: 50,
  });

  const handleCategoryClick = (categoryId: string | null) => {
    if (categoryId === null) {
      router.push("/search");
    } else {
      router.push(`/search?category=${categoryId}`);
    }
  };

  const handleCityChange = (city: string) => {
    // Refetch services when city changes
    refetch();
  };

  const handleMarkerClick = (serviceId: string) => {
    router.push(`/services/${serviceId}`);
  };

  // Convert services to map markers
  const mapMarkers: ServiceMapMarker[] = services
    .filter(s => s.imageUrl) // Only show services with valid coordinates
    .map(s => ({
      id: s.id,
      lat: -32.0333, // For demo - in production, get from service data
      lng: -60.3000,
      title: s.title,
      price: s.price,
      provider: s.provider || "Proveedor",
      imageUrl: s.imageUrl,
    }));

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header con saludo personalizado */}
      <WelcomeHeader />

      {/* Location selector */}
      <LocationSelector onCityChange={handleCityChange} />

      {/* Fake search bar que redirige a /search */}
      <FakeSearchBar />

      {/* Categorías con navegación a /search */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">¿Qué necesitas?</h2>
        <CategoryGrid onSelect={handleCategoryClick} />
      </section>

      {/* Toggle between list and map view */}
      {locStatus !== "loading" && services.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowMap(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              !showMap
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button
            onClick={() => setShowMap(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              showMap
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <Map className="h-4 w-4" />
            Mapa
          </button>
        </div>
      )}

      {/* Map or List view */}
      {showMap && latitude && longitude ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-800">Servicios cercanos</h2>
          <ServiceMap
            center={{ lat: latitude, lng: longitude }}
            markers={mapMarkers}
            userLocation={locStatus === "gps" ? { lat: latitude, lng: longitude } : undefined}
            showAccuracyCircle={locStatus === "gps"}
            onMarkerClick={handleMarkerClick}
            className="w-full h-[500px] rounded-xl"
          />
        </section>
      ) : (
        <>
          {/* Servicios destacados (horizontal scroll) */}
          {locStatus === "loading" ? (
            <section className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">Buscando servicios cerca de ti...</p>
            </section>
          ) : (
            <FeaturedServices services={services} loading={loading} />
          )}

          {/* Sección "Cerca de ti" (placeholder) */}
          <NearYou />
        </>
      )}

      {/* CTA adicional */}
      <section className="flex flex-col gap-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <h3 className="text-lg font-bold text-slate-800">¿Eres profesional?</h3>
        <p className="text-sm text-slate-600">
          Únete a nuestra red de trabajadores verificados y empieza a recibir solicitudes de clientes en tu área.
        </p>
        <button
          onClick={() => router.push("/auth?mode=register")}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          Registrarme como profesional
        </button>
      </section>
    </div>
  );
}
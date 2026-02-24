"use client";

import React, { useState, useCallback, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { GET_SERVICE_CATEGORIES, GET_SERVICE_CATEGORIES_NEARBY } from "../graphql/queries";
import useServices from "@/hooks/useServices";
import { useLocationContext, NominatimResult } from "@/contexts/LocationContext";
import { useAuth } from "@/app/providers";
import { useRoleSwitcher } from "@/hooks/useRoleSwitcher";
import { getLucideIcon } from "../lib/icons";
import { ServiceCategory } from "../types/category";
import EmptyState from "@/components/EmptyState";
import { 
  Map as MapIcon, 
  List, 
  Search, 
  Star, 
  MapPin, 
  Navigation,
  ChevronRight,
  AlertCircle,
  Loader2,
  Plus,
  X,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><rect width="80" height="80" rx="12" fill="%23E5E7EB"/></svg>';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface Job {
  id: string;
  title: string;
  price: {
    total?: number;
    currency?: string;
  } | number | null;
  provider: string;
  imageUrl: string;
  rating?: number;
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const formatPrice = (price: Job['price']): string => {
  if (!price) return 'Consultar';
  
  if (typeof price === 'number') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  if (typeof price === 'object' && price.total) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: price.currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price.total);
  }
  
  return 'Consultar';
};

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 w-full max-w-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-900 mb-1">Error al cargar datos</h3>
          <p className="text-xs text-red-700 mb-3">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-bold text-red-600 hover:text-red-700 underline"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  </div>
);

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const router = useRouter();
  const { status: locStatus, latitude, longitude, cityName, searchAddress, setManualCoords } = useLocationContext();
  const { isAuthenticated, user, hasWorkerRole } = useAuth();
  const { isSwitchingRole, switchToWorker, switchToClient } = useRoleSwitcher();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isWorkerMode = user?.activeRole === 'WORKER';
  
  // Fetch dynamic categories – prefer nearby categories when location is available
  const { 
    data: categoriesData, 
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery(
    latitude && longitude ? GET_SERVICE_CATEGORIES_NEARBY : GET_SERVICE_CATEGORIES,
    {
      variables: latitude && longitude
        ? { latitude, longitude, radiusKm: 15 }
        : undefined,
      fetchPolicy: 'cache-and-network',
    }
  );
  
  const categories: ServiceCategory[] = 
    (latitude && longitude
      ? (categoriesData as any)?.serviceCategoriesNearby
      : (categoriesData as any)?.serviceCategories) || [];
  
  // Fetch services
  const { services, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useServices({
    location: cityName,
    latitude,
    longitude,
    radiusKm: 50,
  });

  const typedServices: Job[] = services.map((s) => ({
    id: s.id,
    title: s.title || 'Sin título',
    price: s.price,
    provider: s.provider || 'Proveedor',
    imageUrl: s.imageUrl || s.image || '',
    rating: typeof s.rating === 'number' ? s.rating : undefined,
  }));

  // Client mode = authenticated + not in worker mode
  const isClientMode = isAuthenticated && !isWorkerMode;
  const showFab = isClientMode && typedServices.length > 0;

  // Debounced Nominatim search
  const handleLocationInput = useCallback((value: string) => {
    setLocationQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setLocationResults([]);
      setShowLocationResults(false);
      return;
    }
    setLocationSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setLocationResults(results);
      setShowLocationResults(results.length > 0);
      setLocationSearching(false);
    }, 500);
  }, [searchAddress]);

  const handleSelectLocation = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.address.city || result.address.town || result.address.village || result.display_name.split(',')[0] || result.display_name;
    setManualCoords(lat, lng, label);
    setLocationQuery(label || "");
    setLocationResults([]);
    setShowLocationResults(false);
  }, [setManualCoords]);

  const clearLocationSearch = useCallback(() => {
    setLocationQuery("");
    setLocationResults([]);
    setShowLocationResults(false);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900">¡Hola! 👋</h1>
        <p className="text-slate-500 text-sm font-medium">¿En qué podemos ayudarte hoy?</p>
      </header>

      {/* Selector de Ubicación con búsqueda OSM */}
      <div className="relative">
        <div className="flex items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-green-100 text-green-600 rounded-xl">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu ubicación</p>
            <input
              type="text"
              value={locationQuery || cityName || ""}
              onChange={(e) => handleLocationInput(e.target.value)}
              onFocus={() => locationResults.length > 0 && setShowLocationResults(true)}
              placeholder="Buscar dirección..."
              className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none w-full"
            />
          </div>
          {locationSearching ? (
            <Loader2 size={18} className="text-slate-400 animate-spin" />
          ) : locationQuery ? (
            <button onClick={clearLocationSearch} aria-label="Limpiar búsqueda">
              <X size={18} className="text-slate-300" />
            </button>
          ) : (
            <ChevronRight size={18} className="text-slate-300" />
          )}
        </div>

        {/* Location search results dropdown */}
        {showLocationResults && locationResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {locationResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectLocation(result)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-50 last:border-b-0"
              >
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar jardineros, plomeros..." 
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          readOnly
          onClick={() => router.push("/search")}
        />
      </div>

      {/* Categorías */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">Categorías</h2>
        
        {categoriesError ? (
          <ErrorMessage 
            message="No se pudieron cargar las categorías" 
            onRetry={() => refetchCategories()}
          />
        ) : categoriesLoading ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <div className="py-2 px-1">
            <p className="text-sm text-slate-400">No hay categorías disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {categories.slice(0, 4).map((cat: ServiceCategory) => {
              const Icon = getLucideIcon(cat.iconName);
              const colors = [
                "bg-green-100 text-green-600",
                "bg-blue-100 text-blue-600",
                "bg-orange-100 text-orange-600",
                "bg-yellow-100 text-yellow-600",
                "bg-purple-100 text-purple-600",
                "bg-pink-100 text-pink-600",
              ];
              const colorIndex = categories.indexOf(cat) % colors.length;
              const color = colors[colorIndex];
              
              return (
                <button
                  key={cat.id}
                  className="flex flex-col items-center gap-2"
                  onClick={() => router.push(`/services/create`)}
                >
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center ${color} shadow-sm active:scale-90 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter line-clamp-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Switch de Vista */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl">
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
          }`}
        >
          <List size={16} /> Lista
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            viewMode === "map" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
          }`}
        >
          <MapIcon size={16} /> Mapa
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="flex flex-col gap-4">
        {viewMode === "map" ? (
          <div className="w-full h-64 bg-slate-200 rounded-3xl flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-60.150,-32.058,12,0/600x400?access_token=none')] bg-cover opacity-50" />
            <div className="z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-white">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Navigation size={14} className="text-blue-500 fill-blue-500" /> 
                Vista de mapa activada
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-800">
              {isClientMode ? "Mis solicitudes recientes" : "Servicios Destacados"}
            </h2>
            
            {servicesError ? (
              <ErrorMessage 
                message={servicesError} 
                onRetry={() => refetchServices()}
              />
            ) : servicesLoading ? (
              <LoadingSpinner />
            ) : typedServices.length === 0 ? (
              isClientMode ? (
                /* CLIENT empty state – guides creation */
                <EmptyState
                  title="¿Necesitas ayuda con algo?"
                  subtitle="Crea tu primera solicitud de trabajo ahora mismo."
                  ctaLabel="Solicitar Servicio"
                  onCta={() => router.push("/services/create")}
                />
              ) : (
                <EmptyState
                  title="Sin servicios disponibles"
                  subtitle="No hay servicios disponibles en tu zona por el momento."
                />
              )
            ) : (
              <div className="flex flex-col gap-4">
                {typedServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm flex gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => router.push(`/services/${service.id}`)}
                  >
                    <div className="relative h-20 w-20 shrink-0">
                      {service.imageUrl ? (
                        <img 
                          src={service.imageUrl} 
                          className="h-full w-full object-cover rounded-2xl" 
                          alt={service.title}
                          onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-100 rounded-2xl flex items-center justify-center">
                          <span className="text-slate-400 text-xs">Sin imagen</span>
                        </div>
                      )}
                      {service.rating && service.rating > 0 && (
                        <div className="absolute -top-2 -right-2 bg-white px-1.5 py-0.5 rounded-lg shadow-sm border border-slate-50 flex items-center gap-0.5">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-black">{service.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between py-1 flex-1">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                          {service.title}
                        </h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">
                          {service.provider}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-black text-sm">
                          {formatPrice(service.price)}
                        </span>
                        <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">
                          Ver más
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Banner Profesional - Smart CTA based on auth state and roles */}
      {!isAuthenticated && (
        <section className="mt-4 p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
          <h3 className="text-xl font-black mb-1">¡Súmate al equipo!</h3>
          <p className="text-blue-100 text-xs mb-4 leading-relaxed">
            Publica tus servicios y llega a cientos de clientes en tu zona de forma inmediata.
          </p>
          <button 
            onClick={() => router.push("/auth?mode=register")}
            className="w-full py-3.5 bg-white text-blue-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg"
          >
            REGISTRARME AHORA
          </button>
        </section>
      )}

      {isAuthenticated && !hasWorkerRole && !isWorkerMode && (
        <section className="mt-4 p-6 bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2.5rem] text-white shadow-xl shadow-green-200">
          <h3 className="text-xl font-black mb-1">¿Quieres trabajar?</h3>
          <p className="text-green-100 text-xs mb-4 leading-relaxed">
            Conviértete en profesional y empieza a ofrecer tus servicios hoy mismo.
          </p>
          <button 
            onClick={() => router.push("/worker/onboarding")}
            className="w-full py-3.5 bg-white text-green-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg"
          >
            QUIERO TRABAJAR
          </button>
        </section>
      )}

      {isAuthenticated && hasWorkerRole && !isWorkerMode && (
        <section className="mt-4 p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] text-white shadow-xl shadow-purple-200">
          <h3 className="text-xl font-black mb-1">Panel Profesional</h3>
          <p className="text-purple-100 text-xs mb-4 leading-relaxed">
            Gestiona tus servicios y trabajos desde tu panel de control.
          </p>
          <button 
            onClick={switchToWorker}
            disabled={isSwitchingRole}
            className="w-full py-3.5 bg-white text-purple-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwitchingRole ? 'CAMBIANDO...' : 'IR A MI PANEL'}
          </button>
        </section>
      )}

      {isAuthenticated && isWorkerMode && (
        <section className="mt-4 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
          <h3 className="text-xl font-black mb-1">Panel de Cliente</h3>
          <p className="text-indigo-100 text-xs mb-4 leading-relaxed">
            Vuelve al modo cliente para buscar y contratar servicios.
          </p>
          <button 
            onClick={switchToClient}
            disabled={isSwitchingRole}
            className="w-full py-3.5 bg-white text-blue-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwitchingRole ? 'CAMBIANDO...' : 'IR A MODO CLIENTE'}
          </button>
        </section>
      )}

      {/* FAB – shown bottom-right when client has existing services */}
      {showFab && (
        <button
          onClick={() => router.push("/services/create")}
          aria-label="Solicitar Servicio"
          className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-full shadow-xl shadow-blue-300 active:scale-95 transition-all font-bold text-sm"
        >
          <Plus size={20} />
          Solicitar Servicio
        </button>
      )}
    </div>
  );
}

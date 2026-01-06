"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import * as LucideIcons from "lucide-react";
import { GET_SERVICE_CATEGORIES } from "../graphql/queries";
import { 
  Map as MapIcon, 
  List, 
  Search, 
  Star, 
  MapPin, 
  Navigation,
  ChevronRight,
} from "lucide-react";

/**
 * NOTA DE COMPATIBILIDAD: 
 * Se han mockeado los hooks de navegación y servicios para permitir 
 * la visualización en el entorno de previsualización sin errores de resolución.
 */

// Mock de hooks para previsualización
const useRouter = () => ({ push: (url: string) => console.log(`Navegando a: ${url}`) });
const useLocationContext = () => ({
  status: "gps",
  latitude: -32.058,
  longitude: -60.150,
  cityName: "Paraná, Entre Ríos"
});

const useServices = (config: any) => ({
  services: [
    { id: "1", title: "Corte de Césped Profesional", price: "$5.500", provider: "Juan Pérez", image: "https://images.unsplash.com/photo-1558905734-b83d8436dd77?w=400", rating: 4.8 },
    { id: "2", title: "Limpieza de Piscinas", price: "$8.000", provider: "Agua Clara", image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400", rating: 4.9 },
    { id: "3", title: "Instalación de Riego", price: "$12.000", provider: "Riego Sur", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", rating: 4.7 }
  ],
  loading: false,
  refetch: () => console.log("Refetching...")
});

/**
 * Get Lucide icon component by name
 */
function getLucideIcon(iconName: string): React.ComponentType<{ size?: number }> {
  const Icon = (LucideIcons as any)[iconName];
  if (!Icon) {
    return LucideIcons.Package; // Fallback icon
  }
  return Icon;
}

export default function HomePage() {
  const router = useRouter();
  const { status: locStatus, latitude, longitude, cityName } = useLocationContext();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  // Fetch dynamic categories
  const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_SERVICE_CATEGORIES);
  const categories = categoriesData?.serviceCategories || [];
  
  const { services, loading } = useServices({
    location: cityName,
    latitude,
    longitude,
    radiusKm: 50,
  });

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900">¡Hola! 👋</h1>
        <p className="text-slate-500 text-sm font-medium">¿En qué podemos ayudarte hoy?</p>
      </header>

      {/* Selector de Ubicación */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-2 bg-green-100 text-green-600 rounded-xl">
          <MapPin size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu ubicación</p>
          <p className="text-sm font-bold text-slate-700">{cityName}</p>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </div>

      {/* Buscador Falso */}
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
        {categoriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {categories.slice(0, 4).map((cat: any) => {
              const Icon = getLucideIcon(cat.iconName);
              // Color mapping for visual variety
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
                <button key={cat.id} className="flex flex-col items-center gap-2">
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
            <h2 className="text-lg font-bold text-slate-800">Servicios Destacados</h2>
            <div className="flex flex-col gap-4">
              {services.map((s) => (
                <div key={s.id} className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm flex gap-4 active:scale-[0.98] transition-transform">
                  <div className="relative h-20 w-20 shrink-0">
                    <img src={s.image} className="h-full w-full object-cover rounded-2xl" alt={s.title} />
                    <div className="absolute -top-2 -right-2 bg-white px-1.5 py-0.5 rounded-lg shadow-sm border border-slate-50 flex items-center gap-0.5">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-black">{s.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{s.title}</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">{s.provider}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-black text-sm">{s.price}</span>
                      <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">Ver más</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Banner Profesional */}
      <section className="mt-4 p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
        <h3 className="text-xl font-black mb-1">¡Súmate al equipo!</h3>
        <p className="text-blue-100 text-xs mb-4 leading-relaxed">Publica tus servicios y llega a cientos de clientes en tu zona de forma inmediata.</p>
        <button 
          onClick={() => router.push("/auth?mode=register")}
          className="w-full py-3.5 bg-white text-blue-700 font-black text-sm rounded-2xl active:scale-95 transition-all shadow-lg"
        >
          REGISTRARME AHORA
        </button>
      </section>
    </div>
  );
}
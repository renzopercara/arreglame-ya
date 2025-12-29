"use client";

import { Star, TrendingUp } from "lucide-react";
import ServiceCard from "./ServiceCard";
import type { Service } from "./ServiceCard";

interface FeaturedServicesProps {
  services: Service[];
  loading?: boolean;
}

export default function FeaturedServices({ services, loading }: FeaturedServicesProps) {
  // Filtrar servicios con rating > 4.5
  const featured = services.filter((service) => {
    // Asumiendo que tenemos un campo rating en el servicio
    // Si no existe, mostrar los primeros 5
    return true; // Por ahora mostrar todos
  }).slice(0, 6);

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-bold text-slate-800">Servicios Destacados</h2>
          </div>
          <TrendingUp className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] h-[180px] bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-lg font-bold text-slate-800">Servicios Destacados</h2>
        </div>
        <TrendingUp className="w-5 h-5 text-slate-400" />
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {featured.map((service) => (
          <div key={service.id} className="min-w-[280px] snap-start">
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { MapPin, Loader, ChevronDown } from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { ENTRE_RIOS_CITIES } from "@/constants/cities";

export default function LocationSelector({ onCityChange }: { onCityChange?: (city: string) => void }) {
  const { status, cityName, setManualCity, refreshLocation } = useLocationContext();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = e.target.value;
    setManualCity(selectedCity);
    onCityChange?.(selectedCity);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-200">
        <Loader className="h-4 w-4 animate-spin text-slate-400" />
        <p className="text-sm text-slate-600">Obteniendo ubicación...</p>
      </div>
    );
  }

  if (status === "manual" || status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-blue-200">
        <MapPin className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-slate-700">Ciudad:</span>
        <div className="relative">
          <select 
            value={cityName || ""} 
            onChange={handleSelect} 
            className="appearance-none bg-transparent pl-2 pr-6 text-sm font-semibold text-slate-800 cursor-pointer"
          >
            <option value="">Elegir ciudad...</option>
            {ENTRE_RIOS_CITIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-slate-400" />
        </div>
      </div>
    );
  }

  // GPS mode
  return (
    <button 
      onClick={refreshLocation} 
      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-green-200 hover:bg-green-50 transition-colors"
    >
      <MapPin className="h-4 w-4 text-green-600" />
      <span className="text-sm font-semibold text-slate-800">
        📍 {cityName || "GPS activo"}
      </span>
    </button>
  );
}


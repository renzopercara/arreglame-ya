"use client";

import useLocation from "@/hooks/useLocation";
import { MapPin, Loader, ChevronDown } from "lucide-react";

const CITIES = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Mar del Plata"];

export default function LocationSelector({ onCityChange }: { onCityChange?: (city: string) => void }) {
  const { status, city, neighborhood, setManualCity, refresh } = useLocation();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = e.target.value;
    setManualCity(c);
    onCityChange?.(c);
  };

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-200">
        <Loader className="h-4 w-4 animate-spin text-slate-400" />
        <p className="text-sm text-slate-600">Buscando servicios cerca de ti...</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-amber-200">
        <MapPin className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-slate-700">Selecciona tu ciudad:</span>
        <div className="relative">
          <select onChange={handleSelect} className="appearance-none bg-transparent pl-2 pr-6 text-sm font-semibold">
            <option value="">Elegir...</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <button onClick={refresh} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-200">
      <MapPin className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-semibold text-slate-800">
        {neighborhood ? `${neighborhood}, ` : ""}{city || "Ubicación"}
      </span>
    </button>
  );
}

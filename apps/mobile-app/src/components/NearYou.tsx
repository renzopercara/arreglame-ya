"use client";

import { MapPin, Clock } from "lucide-react";

export default function NearYou() {
  return (
    <section className="flex flex-col gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Servicios cerca de ti</h2>
          <p className="text-sm text-slate-600">Encuentra ayuda en tu zona</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-white/60 rounded-xl">
        <Clock className="w-5 h-5 text-slate-400" />
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-blue-600">3 trabajadores</span> disponibles en tu área
        </p>
      </div>

      <div className="p-4 bg-white/60 rounded-xl border-2 border-dashed border-blue-200">
        <p className="text-xs text-slate-500 text-center">
          🚀 <strong>Próximamente:</strong> Integración con Google Maps para ver servicios cercanos en tiempo real
        </p>
      </div>
    </section>
  );
}

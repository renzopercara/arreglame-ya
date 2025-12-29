import React, { useState } from "react";
import { 
  CheckCircle2, 
  Plus, 
  Minus, 
  Layers, 
  Maximize, 
  Settings 
} from "lucide-react";

// Mantenemos tus tipos de subcategoría para sincronía con el Backend
export type ServiceSubcategory =
  | "LAWN_MOWING" | "GARDEN_CLEANUP" | "TREE_TRIMMING" | "PRESSURE_WASHING"
  | "INTERIOR_PAINTING" | "EXTERIOR_PAINTING" | "WALL_REPAIR"
  | "AC_INSTALLATION" | "AC_REPAIR" | "AC_MAINTENANCE" | "HEATING_INSTALLATION"
  | "OUTLET_INSTALLATION" | "LIGHTING_INSTALLATION" | "CIRCUIT_BREAKER" | "WIRING_REPAIR"
  | "LEAK_REPAIR" | "PIPE_INSTALLATION" | "DRAIN_CLEANING" | "FAUCET_INSTALLATION";

export interface ServiceMetadata {
  squareMeters?: number;
  units?: number;
  trees?: number;
  coats?: number;
  type?: string;
  meters?: number;
  extras?: string[];
}

interface ServiceFormProps {
  subcategory: ServiceSubcategory;
  onChange: (metadata: ServiceMetadata) => void;
  value?: ServiceMetadata;
}

const EXTRAS_OPTIONS = [
  { id: "URGENT", label: "Urgente (+50%)" },
  { id: "HEIGHT", label: "Altura (+20%)" },
  { id: "DIFFICULT_ACCESS", label: "Acceso difícil (+30%)" },
];

export default function ServiceForm({ subcategory, onChange, value = {} }: ServiceFormProps) {
  const [metadata, setMetadata] = useState<ServiceMetadata>(value);

  const updateMetadata = (updates: Partial<ServiceMetadata>) => {
    const newMetadata = { ...metadata, ...updates };
    setMetadata(newMetadata);
    onChange(newMetadata);
  };

  const toggleExtra = (extra: string) => {
    const currentExtras = metadata.extras || [];
    const newExtras = currentExtras.includes(extra)
      ? currentExtras.filter((e) => e !== extra)
      : [...currentExtras, extra];
    updateMetadata({ extras: newExtras });
  };

  // Componente Reutilizable de Contador (Sustituye a Sliders y TextFields de números)
  const Counter = ({ label, value, min, max, unit, onUpdate }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{value} {unit}</span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={() => value > min && onUpdate(value - 1)}
          className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 active:scale-90 transition-all"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="text-lg font-black text-blue-600 min-w-[20px] text-center">{value}</span>
        <button 
          type="button"
          onClick={() => value < max && onUpdate(value + 1)}
          className="h-10 w-10 flex items-center justify-center bg-blue-600 rounded-xl text-white active:scale-90 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  // ============================================
  // RENDER LOGIC
  // ============================================

  const renderInputs = () => {
    // LÓGICA DE MANTENIMIENTO / JARDÍN
    if (subcategory.match(/LAWN|GARDEN|PRESSURE/)) {
      return (
        <div className="space-y-4">
          <Counter 
            label="Metros Cuadrados" 
            value={metadata.squareMeters || 50} 
            min={10} max={1000} unit="m²"
            onUpdate={(val: number) => updateMetadata({ squareMeters: val })}
          />
        </div>
      );
    }

    // LÓGICA DE PINTURA
    if (subcategory.match(/PAINTING|WALL/)) {
      return (
        <div className="space-y-4">
          <Counter 
            label="Superficie a pintar" 
            value={metadata.squareMeters || 20} 
            min={5} max={500} unit="m²"
            onUpdate={(val: number) => updateMetadata({ squareMeters: val })}
          />
          <Counter 
            label="Manos de pintura" 
            value={metadata.coats || 2} 
            min={1} max={4} unit="manos"
            onUpdate={(val: number) => updateMetadata({ coats: val })}
          />
        </div>
      );
    }

    // LÓGICA DE CLIMA (HVAC)
    if (subcategory.match(/AC|HEATING/)) {
      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-700 ml-1">Tipo de Equipo</span>
            <div className="grid grid-cols-2 gap-2">
              {['SPLIT', 'WINDOW'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateMetadata({ type: t })}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                    metadata.type === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Counter 
            label="Cantidad de Unidades" 
            value={metadata.units || 1} 
            min={1} max={10} unit="equipos"
            onUpdate={(val: number) => updateMetadata({ units: val })}
          />
        </div>
      );
    }

    // LÓGICA DE ELECTRICIDAD / PLOMERÍA (UNIDADES)
    if (subcategory.match(/OUTLET|LIGHTING|FAUCET|PIPE/)) {
      const isMeters = subcategory.includes("PIPE") || subcategory.includes("WIRING");
      return (
        <Counter 
          label={isMeters ? "Metros de recorrido" : "Cantidad de unidades"} 
          value={isMeters ? (metadata.meters || 5) : (metadata.units || 1)} 
          min={1} max={100} unit={isMeters ? "metros" : "unid."}
          onUpdate={(val: number) => updateMetadata(isMeters ? { meters: val } : { units: val })}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Sección Dinámica */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Detalles del Servicio</h3>
        {renderInputs()}
      </div>

      {/* Sección de Extras (Checkboxes visuales) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Opciones Adicionales</h3>
        <div className="grid grid-cols-1 gap-2">
          {EXTRAS_OPTIONS.map((extra) => {
            const isSelected = metadata.extras?.includes(extra.id);
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => toggleExtra(extra.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isSelected 
                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                    : "bg-white border-slate-100 text-slate-600"
                }`}
              >
                <span className="text-sm font-semibold">{extra.label}</span>
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { 
  Wrench, 
  Paintbrush, 
  Snowflake, 
  Droplets, 
  Zap, 
  LayoutGrid,
  ChevronRight
} from "lucide-react";

/**
 * Category - Estructura alineada con ServiceCategory del Backend
 */
interface Category {
  id: string | null;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORIES: Category[] = [
  { 
    id: null, 
    label: "Todos", 
    icon: LayoutGrid,
    description: "Ver todos los servicios disponibles"
  },
  { 
    id: "MAINTENANCE", 
    label: "Mantenimiento", 
    icon: Wrench,
    description: "Jardín, limpieza y reparaciones generales"
  },
  { 
    id: "PAINTING", 
    label: "Pintura", 
    icon: Paintbrush,
    description: "Paredes, techos y aberturas"
  },
  { 
    id: "HVAC", 
    label: "Clima", 
    icon: Snowflake,
    description: "Aire acondicionado y calefacción"
  },
  { 
    id: "ELECTRICAL", 
    label: "Electricidad", 
    icon: Zap,
    description: "Instalaciones y arreglos eléctricos"
  },
  { 
    id: "PLUMBING", 
    label: "Plomería", 
    icon: Droplets,
    description: "Grifería, tanques y cañerías"
  },
];

interface CategoryGridProps {
  onSelect?: (id: string | null) => void;
  activeId?: string | null;
  variant?: "compact" | "full"; 
}

export default function CategoryGrid({ 
  onSelect, 
  activeId,
  variant = "compact"
}: CategoryGridProps) {
  const isCompact = variant === "compact";

  return (
    <div className={`grid ${isCompact ? 'grid-cols-3' : 'grid-cols-1'} gap-3 p-1`}>
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isActive = activeId === category.id;

        return (
          <button
            key={category.id ?? "all"}
            type="button"
            onClick={() => onSelect?.(category.id)}
            className={`flex ${isCompact ? 'flex-col' : 'flex-row'} items-center gap-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              isCompact ? 'p-3' : 'p-4'
            } ${
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-blue-200"
            }`}
          >
            {/* Icon Container */}
            <div
              className={`flex ${isCompact ? 'h-12 w-12' : 'h-14 w-14'} items-center justify-center rounded-xl transition-colors flex-shrink-0 ${
                isActive 
                  ? "bg-white/20 text-white" 
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Icon className={`${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`} />
            </div>

            {/* Content Container */}
            <div className={`flex-1 ${isCompact ? 'text-center' : 'text-left'}`}>
              <span className={`block font-bold ${isCompact ? 'text-xs truncate' : 'text-base'}`}>
                {category.label}
              </span>
              {!isCompact && (
                <p className={`text-xs mt-0.5 line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  {category.description}
                </p>
              )}
            </div>

            {/* Indicador visual solo para versión Full */}
            {!isCompact && (
              <ChevronRight className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORIES };
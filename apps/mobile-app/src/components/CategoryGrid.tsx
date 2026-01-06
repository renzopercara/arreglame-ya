import React from "react";
import {
  Wrench,
  Paintbrush,
  Snowflake,
  Droplets,
  Zap,
  LayoutGrid,
  ChevronRight,
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
    description: "Ver todos los servicios disponibles",
  },
  {
    id: "MAINTENANCE",
    label: "Mantenimiento",
    icon: Wrench,
    description: "Jardín, limpieza y reparaciones generales",
  },
  {
    id: "PAINTING",
    label: "Pintura",
    icon: Paintbrush,
    description: "Paredes, techos y aberturas",
  },
  {
    id: "HVAC",
    label: "Clima",
    icon: Snowflake,
    description: "Aire acondicionado y calefacción",
  },
  {
    id: "ELECTRICAL",
    label: "Electricidad",
    icon: Zap,
    description: "Instalaciones y arreglos eléctricos",
  },
  {
    id: "PLUMBING",
    label: "Plomería",
    icon: Droplets,
    description: "Grifería, tanques y cañerías",
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
  variant = "compact",
}: CategoryGridProps) {
  /**
   * ======================
   * COMPACT VARIANT (CHIPS)
   * ======================
   */
  if (variant === "compact") {
    return (
      <div className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeId === category.id;

          return (
            <button
              key={category.id ?? "all"}
              type="button"
              onClick={() => onSelect?.(category.id)}
              className={`
                flex shrink-0 items-center gap-1.5
                rounded-full
                px-3 py-1.5
                text-xs font-semibold
                transition
                active:scale-95
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {category.label}
            </button>
          );
        })}
      </div>
    );
  }

  /**
   * ======================
   * FULL VARIANT (CARDS)
   * ======================
   */
  return (
    <div className="grid grid-cols-1 gap-3 p-1">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isActive = activeId === category.id;

        return (
          <button
            key={category.id ?? "all"}
            type="button"
            onClick={() => onSelect?.(category.id)}
            className={`
              flex items-center gap-4 rounded-2xl p-4 text-left
              transition-all duration-200 active:scale-95
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-blue-200"
              }
            `}
          >
            {/* Icon */}
            <div
              className={`
                flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0
                ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-blue-600"
                }
              `}
            >
              <Icon className="h-7 w-7" />
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <span className="block text-base font-bold">
                {category.label}
              </span>
              <p
                className={`mt-0.5 text-xs line-clamp-1 ${
                  isActive ? "text-blue-100" : "text-slate-500"
                }`}
              >
                {category.description}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight
              className={`h-5 w-5 ${
                isActive ? "text-white" : "text-slate-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORIES };

"use client";

import { SearchX, RotateCcw } from "lucide-react";

interface EmptySearchStateProps {
  query?: string;
  category?: string | null;
  onClearFilters: () => void;
}

export default function EmptySearchState({ query, category, onClearFilters }: EmptySearchStateProps) {
  const hasFilters = query || category;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <SearchX className="h-10 w-10 text-slate-400" />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold text-slate-800">
          No encontramos servicios
        </h3>
        <p className="text-sm text-slate-600 max-w-sm">
          {hasFilters 
            ? "Intenta ajustar tus filtros o búsqueda para ver más resultados." 
            : "No hay servicios disponibles en este momento."}
        </p>
      </div>

      {/* Clear filters button */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar filtros
        </button>
      )}

      {/* Suggestion */}
      <p className="text-xs text-slate-500 mt-4">
        💡 <strong>Sugerencia:</strong> Prueba buscar por categoría o elimina algunos filtros
      </p>
    </div>
  );
}

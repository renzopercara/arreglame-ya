"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
}

export default function SearchBar({
  value,
  placeholder = "Buscar servicios...",
  onChange,
  onFilterClick,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 flex-1">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border-none bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

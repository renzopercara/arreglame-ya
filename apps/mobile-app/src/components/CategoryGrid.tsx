import React from "react";
import { Wrench, Paintbrush, FlameKindling, Droplets, Sparkles, Shield } from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: Category[] = [
  { id: "plumbing", label: "Plomería", icon: Droplets },
  { id: "electric", label: "Eléctrico", icon: Sparkles },
  { id: "painting", label: "Pintura", icon: Paintbrush },
  { id: "hvac", label: "Clima", icon: FlameKindling },
  { id: "security", label: "Seguridad", icon: Shield },
  { id: "general", label: "General", icon: Wrench },
];

interface Props {
  onSelect?: (id: string | null) => void;
  activeId?: string | null;
}

export default function CategoryGrid({ onSelect, activeId }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onSelect?.(null)}
        className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
          !activeId ? "bg-blue-600 text-white" : "bg-white text-slate-700"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
          All
        </span>
        <span>Todos</span>
      </button>
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeId === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect?.(category.id)}
            className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
              isActive ? "bg-blue-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}

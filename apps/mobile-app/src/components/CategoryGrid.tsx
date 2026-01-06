"use client";

import React from "react";
import { useQuery } from "@apollo/client/react";
import * as LucideIcons from "lucide-react";
import { GET_SERVICE_CATEGORIES } from "../graphql/queries";
import { getLucideIcon } from "../lib/icons";
import { ServiceCategory } from "../types/category";

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
  // Fetch categories from API
  const { data, loading, error } = useQuery(GET_SERVICE_CATEGORIES);

  /**
   * ======================
   * LOADING STATE
   * ======================
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  /**
   * ======================
   * ERROR STATE
   * ======================
   */
  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="rounded-2xl bg-red-50 p-4 text-center">
          <p className="text-sm font-semibold text-red-600">
            Error al cargar categorías
          </p>
          <p className="mt-1 text-xs text-red-500">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const categories: ServiceCategory[] = data?.serviceCategories || [];

  /**
   * ======================
   * EMPTY STATE
   * ======================
   */
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-slate-500">
          No hay categorías disponibles
        </p>
      </div>
    );
  }

  /**
   * ======================
   * COMPACT VARIANT (CHIPS)
   * ======================
   */
  if (variant === "compact") {
    return (
      <div className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {categories.map((category) => {
          const Icon = getLucideIcon(category.iconName);
          const isActive = activeId === category.id;

          return (
            <button
              key={category.id}
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
              {category.name}
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
      {categories.map((category) => {
        const Icon = getLucideIcon(category.iconName);
        const isActive = activeId === category.id;

        return (
          <button
            key={category.id}
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
                {category.name}
              </span>
              <p
                className={`mt-0.5 text-xs line-clamp-1 ${
                  isActive ? "text-blue-100" : "text-slate-500"
                }`}
              >
                {category.description || "Sin descripción"}
              </p>
            </div>

            {/* Arrow */}
            <LucideIcons.ChevronRight
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

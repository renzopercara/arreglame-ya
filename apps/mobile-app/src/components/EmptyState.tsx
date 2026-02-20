"use client";

import React from "react";
import { Wrench } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * EmptyState
 *
 * Reusable visually-centered empty state component.
 * Used in the Client Creation Hub when no service requests exist.
 */
export default function EmptyState({
  title = "¿Necesitas ayuda con algo?",
  subtitle = "Crea tu primera solicitud de trabajo ahora mismo.",
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Illustration placeholder */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50">
        <Wrench className="h-12 w-12 text-blue-400" />
      </div>

      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">{subtitle}</p>

      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-8 py-4 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

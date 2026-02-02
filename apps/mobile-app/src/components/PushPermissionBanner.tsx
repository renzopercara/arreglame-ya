"use client";

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface PushPermissionBannerProps {
  onDismiss?: () => void;
}

/**
 * Banner to warn professionals about denied push notification permissions
 * Shows the impact on their ability to receive job opportunities
 */
export function PushPermissionBanner({ onDismiss }: PushPermissionBannerProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-amber-900 mb-1">
            Notificaciones Desactivadas
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Las notificaciones están bloqueadas. Podrías perder oportunidades de trabajo.
            Activa las notificaciones en la configuración de tu dispositivo para recibir
            alertas de nuevos trabajos en tiempo real.
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-amber-600 hover:text-amber-700 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

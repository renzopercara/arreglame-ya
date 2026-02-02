"use client";

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { client } from '../../../../../graphql/client';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for PRO routes
 * Provides user-friendly error handling with retry capability
 */
export default function ProErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();

  const handleRetry = async () => {
    try {
      // Clear Apollo cache to ensure fresh data
      await client.clearStore();
      // Reset error boundary
      reset();
    } catch (e) {
      console.error('Failed to reset error boundary:', e);
      // Force reload if reset fails
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 text-center mb-3">
          Oops, algo salió mal
        </h1>

        {/* Description */}
        <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
          Lo sentimos, encontramos un problema al cargar tu dashboard profesional.
          Por favor, intenta nuevamente.
        </p>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-mono text-slate-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            className="
              flex items-center justify-center gap-2
              w-full py-3.5 px-4
              bg-emerald-600 hover:bg-emerald-700
              text-white font-bold text-sm rounded-2xl
              shadow-lg shadow-emerald-200
              active:scale-95 transition-all
            "
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>

          <button
            onClick={() => router.push('/')}
            className="
              w-full py-3 px-4
              bg-slate-100 hover:bg-slate-200
              text-slate-700 font-bold text-sm rounded-2xl
              active:scale-95 transition-all
            "
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

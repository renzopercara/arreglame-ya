"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { INCREMENT_SERVICE_PRICE, GET_MY_SERVICE_REQUESTS } from "@/graphql/queries";
import { CheckCircle, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Radar animation component
// ---------------------------------------------------------------------------
function RadarAnimation() {
  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto mb-8">
      {/* Ripple rings */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border-2 border-blue-400 opacity-0 animate-ping"
          style={{
            width: `${(i + 1) * 40}px`,
            height: `${(i + 1) * 40}px`,
            animationDelay: `${i * 0.6}s`,
            animationDuration: "2s",
          }}
        />
      ))}
      {/* Center dot */}
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-300">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ServiceRequestSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const requestId = params.get("id");

  const [incrementCount, setIncrementCount] = useState(0);
  const [maxIncrementCount, setMaxIncrementCount] = useState(3);
  const [canIncrement, setCanIncrement] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const [incrementPrice, { loading: incrementing }] = useMutation(INCREMENT_SERVICE_PRICE, {
    onCompleted: (data: any) => {
      const result = data?.incrementServicePrice;
      if (result) {
        setIncrementCount(result.incrementCount);
        setMaxIncrementCount(result.maxIncrementCount);
        setCanIncrement(result.canIncrementAgain);
        setCurrentPrice(result.estimatedFinalPrice);
        toast.success("¡Oferta mejorada! Los profesionales cercanos serán notificados.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "No se pudo actualizar el precio.");
    },
  });

  const handleIncentivize = () => {
    if (!requestId || !canIncrement || incrementing) return;
    incrementPrice({ variables: { serviceRequestId: requestId } });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-b from-white to-blue-50">
      {/* Radar animation while searching */}
      <RadarAnimation />

      {/* Status message */}
      <h1 className="text-2xl font-black text-slate-900 text-center mb-3">
        ¡Solicitud creada!
      </h1>
      <p className="text-base font-bold text-slate-600 text-center mb-2">
        Estamos buscando profesionales.
      </p>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed mb-6">
        Si tienes prisa, puedes aumentar la oferta para captar su atención.
      </p>

      {requestId && (
        <p className="text-xs text-slate-300 mb-6">ID: {requestId}</p>
      )}

      {/* Current price display */}
      {currentPrice !== null && (
        <div className="w-full max-w-xs bg-white border border-slate-100 rounded-2xl p-4 mb-6 text-center shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Oferta actual</p>
          <p className="text-3xl font-black text-blue-600">{formatPrice(currentPrice)}</p>
          <p className="text-xs text-slate-400 mt-1">{incrementCount} de {maxIncrementCount} incrementos usados</p>
        </div>
      )}

      {/* Incentivize button */}
      {requestId && canIncrement && (
        <button
          onClick={handleIncentivize}
          disabled={incrementing || !canIncrement}
          className="w-full max-w-xs py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {incrementing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Actualizando oferta...
            </>
          ) : (
            <>
              <TrendingUp className="h-5 w-5" />
              Subir precio para agilizar
            </>
          )}
        </button>
      )}

      {/* Max limit reached */}
      {!canIncrement && incrementCount > 0 && (
        <div className="w-full max-w-xs flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Límite de incrementos alcanzado.</p>
        </div>
      )}

      {/* Return button */}
      <button
        onClick={() => router.push("/")}
        className="w-full max-w-xs py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all mt-2"
      >
        Volver al inicio
      </button>
    </div>
  );
}

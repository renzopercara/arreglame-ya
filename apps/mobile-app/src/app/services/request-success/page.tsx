"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ServiceRequestSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const requestId = params.get("id");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-b from-white to-blue-50">
      {/* Check icon */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
        <CheckCircle className="h-14 w-14 text-blue-600" />
      </div>

      {/* Message */}
      <h1 className="text-2xl font-black text-slate-900 text-center mb-3">
        ¡Solicitud creada!
      </h1>
      <p className="text-base font-bold text-slate-600 text-center mb-2">
        Estamos buscando al mejor profesional para ti.
      </p>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed mb-10">
        Te notificaremos en cuanto alguien acepte el desafío.
      </p>

      {requestId && (
        <p className="text-xs text-slate-300 mb-8">ID: {requestId}</p>
      )}

      {/* Return button */}
      <button
        onClick={() => router.push("/")}
        className="w-full max-w-xs py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
      >
        Volver al inicio
      </button>
    </div>
  );
}

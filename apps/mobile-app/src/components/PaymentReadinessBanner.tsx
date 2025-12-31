"use client";

import usePaymentReadiness from "@/hooks/usePaymentReadiness";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, CreditCard, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentReadinessBanner() {
  const { isAuthenticated, user } = useAuth();
  const { hasPaymentMethod, isMpConnected } = usePaymentReadiness();
  const router = useRouter();

  // BLOCK 4: Banner should NOT appear when logged in
  // This ensures a clean UX where authenticated users don't see login prompts
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <p className="text-sm font-semibold text-slate-800">Inicia sesión para contratar o publicar servicios</p>
        </div>
        <button
          onClick={() => router.push("/auth?mode=login")}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  // Determine role - prefer activeRole over base role for dual-role users
  const role = user.activeRole || user.role;

  if (role === "CLIENT" && !hasPaymentMethod) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-semibold text-slate-800">Agrega un método de pago para contratar servicios</p>
        </div>
        <button
          onClick={() => router.push("/profile?setup=payments")}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95"
        >
          Vincular tarjeta
        </button>
      </div>
    );
  }

  if (role === "WORKER" && !isMpConnected) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-purple-600" />
          <p className="text-sm font-semibold text-slate-800">Configura tu cuenta de Mercado Pago para recibir cobros</p>
        </div>
        <button
          onClick={() => router.push("/profile?setup=mercadopago")}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700 active:scale-95"
        >
          Conectar
        </button>
      </div>
    );
  }

  return null;
}

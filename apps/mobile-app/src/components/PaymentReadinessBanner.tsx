"use client";

import React from "react";
import { ShieldCheck, CreditCard, Link as LinkIcon, AlertCircle } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES & MOCKS (Para mantener la consistencia con el error de User)         */
/* -------------------------------------------------------------------------- */

export interface User {
  id: string;
  name: string;
  activeRole: 'CLIENT' | 'PROVIDER';
  roles: string[];
}

// Mock de hooks para la previsualización
const useAuth = () => ({
  isAuthenticated: true,
  user: { activeRole: 'PROVIDER' } as User
});

const usePaymentReadiness = () => ({
  hasPaymentMethod: false,
  isMpConnected: false
});

const useRouter = () => ({
  push: (path: string) => console.log("Navigating to:", path)
});

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function PaymentReadinessBanner() {
  const { isAuthenticated, user } = useAuth();
  const { hasPaymentMethod, isMpConnected } = usePaymentReadiness();
  const router = useRouter();

  // Caso: Usuario no autenticado
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Seguridad primero</p>
            <p className="text-xs text-slate-500">Inicia sesión para contratar servicios</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/auth?mode=login")}
          className="whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
        >
          Ingresar
        </button>
      </div>
    );
  }

  // FIX: Se usa únicamente activeRole para evitar errores de tipo
  const role = user.activeRole;

  // Caso: Cliente sin método de pago
  if (role === "CLIENT" && !hasPaymentMethod) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Método de pago</p>
            <p className="text-xs text-slate-500">Necesario para confirmar pedidos</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/profile?setup=payments")}
          className="whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
        >
          Configurar
        </button>
      </div>
    );
  }

  // Caso: Proveedor sin Mercado Pago (Se usa PROVIDER en lugar de WORKER)
  if (role === "PROVIDER" && !isMpConnected) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <LinkIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Cobros pendientes</p>
            <p className="text-xs text-slate-500">Conecta Mercado Pago para cobrar</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/profile?setup=mercadopago")}
          className="whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
        >
          Conectar
        </button>
      </div>
    );
  }

  return null;
}

// Preview
export function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md space-y-4">
        <h3 className="text-center text-sm font-bold uppercase tracking-widest text-slate-400">Preview de Banners</h3>
        <PaymentReadinessBanner />
      </div>
    </div>
  );
}
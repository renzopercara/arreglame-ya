"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Clock3, 
  LogOut, 
  ShieldCheck, 
  Star, 
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isBootstrapping, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* ------------------------------- LOGOUT ------------------------------- */
  
  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    toast.success('Sesión cerrada correctamente');
  };

  /* ---------------------------- RENDER LOGIC ---------------------------- */

  // Show skeleton during bootstrap
  if (isBootstrapping) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-48" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  // Not authenticated - show login prompt (BLOCK 1)
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <p className="text-sm font-semibold text-blue-600">Perfil</p>
            <h1 className="text-2xl font-bold text-slate-900">Tu cuenta</h1>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col items-center gap-4 text-center">
            <UserAvatar size="xl" />
            <div>
              <p className="text-lg font-bold text-slate-900">Accede a tu perfil</p>
              <p className="text-sm text-slate-500">Inicia sesión para ver tu información personal</p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Iniciar sesión
            </button>
          </div>
        </section>

        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'Usuario';
  const mpConnected = !!user.mercadopagoCustomerId;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <p className="text-sm font-semibold text-blue-600">Perfil</p>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {firstName}</h1>
        </div>
      </header>

      {/* User Profile Section */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <UserAvatar 
            name={user.name} 
            avatar={user.avatar}
            size="xl"
          />

          <div className="flex-1">
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.rating && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3" /> {user.rating.toFixed(1)}
                </span>
              )}
              {user.totalJobs !== undefined && (
                <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  <Clock3 className="h-3 w-3" /> {user.totalJobs} trabajos
                </span>
              )}
              {user.status === 'VERIFIED' && (
                <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Verificado
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MercadoPago Section */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${mpConnected ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <CreditCard className={`h-5 w-5 ${mpConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Mercado Pago</p>
              <p className="text-xs text-slate-500">
                {mpConnected ? 'Cuenta vinculada' : 'No vinculado'}
              </p>
            </div>
          </div>
          {mpConnected ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
        </div>

        {mpConnected ? (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs font-medium text-emerald-800">
              Cuenta configurada
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-600">
              Vincula tu cuenta de Mercado Pago para recibir y realizar pagos de forma segura.
            </p>
          </div>
        )}
      </section>

      {/* Account Stats */}
      {user.balance !== undefined && (
        <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <DollarSign className="h-4 w-4" />
            Saldo disponible
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${user.balance.toFixed(2)}
          </p>
        </section>
      )}

      {/* BLOCK 8: Logout Button with Confirmation */}
      <button 
        onClick={() => setShowLogoutModal(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition border border-red-100"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cerrar sesión?</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Estás seguro que deseas cerrar tu sesión?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

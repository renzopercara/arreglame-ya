'use client';

import React, { useState } from 'react';
import { useAuth } from '../providers';
import { 
  ArrowLeft, 
  Clock3, 
  LogOut, 
  ShieldCheck, 
  Star, 
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  X,
  Loader2,
} from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

const UserAvatar = ({ name, avatar, size = "md" }: { name?: string, avatar?: string, size?: "md" | "xl" }) => (
  <div className={`rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold ${size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-lg'}`}>
    {avatar ? (
      <img src={avatar} alt={name} className="w-full h-full rounded-2xl object-cover" />
    ) : (
      name?.charAt(0)?.toUpperCase() || <UserIcon />
    )}
  </div>
);

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      await login(email, password, 'CLIENT');
      toast.success('¡Bienvenido!');
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Credenciales inválidas');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
          disabled={loading}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-2 text-slate-900">Iniciar Sesión</h2>
        <p className="text-slate-500 text-sm mb-6">Accede a tu cuenta para gestionar tus servicios.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              placeholder="tu@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isBootstrapping, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      toast.success('Sesión cerrada correctamente');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  // Loading state
  if (isBootstrapping) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col gap-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-32" />
          </div>
        </div>
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <p className="text-sm font-semibold text-blue-600">Perfil</p>
            <h1 className="text-2xl font-bold text-slate-900">Tu cuenta</h1>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col items-center gap-4 text-center">
            <UserAvatar size="xl" />
            <div>
              <p className="text-lg font-bold text-slate-900">Accede a tu perfil</p>
              <p className="text-sm text-slate-500">Inicia sesión para ver tu información personal</p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
            >
              Iniciar sesión
            </button>
          </div>
        </section>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // Authenticated state
  const firstName = user.name?.split(' ')[0] || 'Usuario';
  const mpConnected = !!user.mercadopagoCustomerId;

  return (
    <div className="max-w-md mx-auto p-6 flex flex-col gap-6 font-sans bg-slate-50/50 min-h-screen">
      <header className="flex items-center gap-3">
        <button 
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <p className="text-sm font-semibold text-blue-600">Perfil</p>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {firstName}</h1>
        </div>
      </header>

      {/* User Profile Section */}
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} avatar={user.avatar} size="xl" />
          <div className="flex-1">
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.rating && user.rating > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3 fill-amber-700" /> {user.rating.toFixed(1)}
                </span>
              )}
              {user.totalJobs !== undefined && user.totalJobs > 0 && (
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
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
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
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs font-medium text-emerald-800">Cuenta configurada correctamente</p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-600">Vincula tu cuenta para recibir y realizar pagos de forma segura.</p>
          </div>
        )}
      </section>

      {/* Account Stats */}
      {user.balance !== undefined && user.balance > 0 && (
        <section className="flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-lg shadow-blue-100 text-white">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <DollarSign className="h-4 w-4" />
            Saldo disponible
          </div>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 2,
            }).format(user.balance)}
          </p>
        </section>
      )}

      <button 
        onClick={() => setShowLogoutModal(true)}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-bold text-red-600 shadow-sm border border-red-50 hover:bg-red-50 transition"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Cerrar sesión?</h3>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              ¿Estás seguro que deseas cerrar tu sesión actual? Tendrás que volver a ingresar tus credenciales.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
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

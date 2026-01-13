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
  Mail,
  Lock,
  User,
  UserCog,
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

const AuthModal = ({ isOpen, onClose, initialMode = "login" }: { isOpen: boolean, onClose: () => void, initialMode?: "login" | "register" }) => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">("CLIENT");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  // Update mode when initialMode prop changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Reset errors when mode changes or modal closes
  const handleModeChange = (newMode: "login" | "register") => {
    setMode(newMode);
    setError('');
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === "login") {
      // Login flow
      if (!email || !password) {
        setError('Por favor completa todos los campos');
        return;
      }

      try {
        await login(email, password, role);
        toast.success('¡Bienvenido!');
        handleClose();
      } catch (err: unknown) {
        console.error('Login error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Credenciales inválidas';
        setError(errorMessage);
      }
    } else {
      // Register flow
      if (!name || !email || !password) {
        setError('Por favor completa todos los campos');
        return;
      }

      if (!termsAccepted) {
        setError('Debes aceptar los términos y condiciones');
        return;
      }

      try {
        await register(email, password, name, role, termsAccepted);
        toast.success('¡Cuenta creada exitosamente!');
        handleClose();
      } catch (err: unknown) {
        console.error('Register error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al crear la cuenta';
        setError(errorMessage);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative">
        <button 
          onClick={handleClose} 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
          disabled={loading}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-2 text-slate-900">
          {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          {mode === "login" 
            ? "Accede a tu cuenta para gestionar tus servicios." 
            : "Únete a Arréglame Ya y empieza hoy."}
        </p>

        {/* Mode Selector (Tabs) */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => handleModeChange("login")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("register")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Field (Register only) */}
          {mode === "register" && (
            <div>
              <label htmlFor="name" className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
                <User className="h-5 w-5 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                  placeholder="Nombre completo"
                  disabled={loading}
                  required
                />
              </label>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <Mail className="h-5 w-5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                placeholder="correo@ejemplo.com"
                disabled={loading}
                autoComplete="email"
                required
              />
            </label>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <Lock className="h-5 w-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                placeholder="Contraseña"
                disabled={loading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </label>
          </div>

          {/* Role Selector */}
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setRole("CLIENT")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-tight transition-all ${
                role === "CLIENT" ? "bg-white text-indigo-600 shadow-sm border border-indigo-50" : "text-slate-400"
              }`}
            >
              <User size={14} /> Cliente
            </button>
            <button
              type="button"
              onClick={() => setRole("PROVIDER")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-tight transition-all ${
                role === "PROVIDER" ? "bg-white text-indigo-600 shadow-sm border border-indigo-50" : "text-slate-400"
              }`}
            >
              <UserCog size={14} /> Profesional
            </button>
          </div>

          {/* Terms Checkbox (Register only) */}
          {mode === "register" && (
            <label className="flex items-start gap-3 cursor-pointer group px-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                required
              />
              <span className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Acepto los <span className="text-indigo-600 font-bold underline">Términos</span> y la <span className="text-indigo-600 font-bold underline">Privacidad</span> de Arréglame Ya.
              </span>
            </label>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === "register" && !termsAccepted)}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            aria-disabled={loading || (mode === "register" && !termsAccepted)}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}
              </>
            ) : (
              mode === "login" ? "Entrar al Sistema" : "Finalizar Registro"
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
  const [authModalInitialMode, setAuthModalInitialMode] = useState<"login" | "register">("login");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleOpenAuthModal = (mode: "login" | "register") => {
    setAuthModalInitialMode(mode);
    setShowAuthModal(true);
  };

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
              <p className="text-sm text-slate-500">Crea una cuenta o inicia sesión para continuar</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => handleOpenAuthModal("register")}
                className="w-full flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 active:scale-95"
              >
                Registrarse
              </button>
              <button
                onClick={() => handleOpenAuthModal("login")}
                className="w-full flex items-center justify-center rounded-2xl bg-white border-2 border-slate-200 px-6 py-4 text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </section>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authModalInitialMode} />
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

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
  Loader2,
  User as UserIcon,
  X
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES & MOCKS (Resolved from missing imports)                              */
/* -------------------------------------------------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  activeRole: 'CLIENT' | 'PROVIDER';
  avatar?: string;
  // Campos faltantes que causaban error de compilación:
  mercadopagoCustomerId?: string;
  rating?: number;
  totalJobs?: number;
  status?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  balance?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  isBootstrapping: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Mock components to replace missing local imports
const UserAvatar = ({ name, avatar, size = "md" }: { name?: string, avatar?: string, size?: "md" | "xl" }) => (
  <div className={`rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold ${size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-lg'}`}>
    {avatar ? <img src={avatar} alt={name} className="w-full h-full rounded-2xl object-cover" /> : (name?.charAt(0) || <UserIcon />)}
  </div>
);

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400"><X size={20} /></button>
        <h2 className="text-xl font-bold mb-2">Iniciar Sesión</h2>
        <p className="text-slate-500 text-sm mb-6">Accede a tu cuenta para gestionar tus servicios.</p>
        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Continuar</button>
      </div>
    </div>
  );
};

const toast = {
  success: (msg: string) => console.log("Toast Success:", msg),
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

function ProfilePage() {
  const { isAuthenticated, user, isBootstrapping, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    toast.success('Sesión cerrada correctamente');
  };

  if (isBootstrapping) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-48" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
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

  const firstName = user.name?.split(' ')[0] || 'Usuario';
  const mpConnected = !!user.mercadopagoCustomerId;

  return (
    <div className="max-w-md mx-auto p-6 flex flex-col gap-6 font-sans bg-slate-50/50 min-h-screen">
      <header className="flex items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
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
              {user.rating && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3 fill-amber-700" /> {user.rating.toFixed(1)}
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
      {user.balance !== undefined && (
        <section className="flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-lg shadow-blue-100 text-white">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <DollarSign className="h-4 w-4" />
            Saldo disponible
          </div>
          <p className="text-3xl font-bold">
            ${user.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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

/* -------------------------------------------------------------------------- */
/* EXPORT WRAPPER                                                             */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [user, setUser] = useState<User | null>({
    id: 'u1',
    name: 'Juan Pérez',
    email: 'juan.perez@ejemplo.com',
    roles: ['CLIENT', 'PROVIDER'],
    activeRole: 'CLIENT',
    mercadopagoCustomerId: 'mp_987654',
    rating: 4.8,
    totalJobs: 24,
    status: 'VERIFIED',
    balance: 15420.50
  });

  const logout = async () => {
    await new Promise(r => setTimeout(r, 500));
    setUser(null);
  };

  const login = async (token: string, userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      isBootstrapping: false, 
      logout, 
      login 
    }}>
      <ProfilePage />
    </AuthContext.Provider>
  );
}
"use client";

import React, { useState } from "react";
import { Sparkles, User as UserIcon, ArrowLeftRight } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES & MOCKS (Para evitar errores de importación en el preview)           */
/* -------------------------------------------------------------------------- */

interface User {
  id: string;
  name: string;
  avatar?: string;
  activeRole: 'CLIENT' | 'WORKER';
  roles: string[]; // El array que contiene los permisos
}

// Mocks de componentes internos
const UserAvatar = ({ name, avatar, size }: any) => (
  <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
    {avatar ? <img src={avatar} alt={name} /> : <UserIcon size={20} className="text-slate-400" />}
  </div>
);
const AuthModal = ({ isOpen, onClose }: any) => null;

// Mock de AuthContext
const useAuth = () => ({
  isAuthenticated: true,
  user: {
    name: "Juan Pérez",
    activeRole: "CLIENT",
    roles: ["CLIENT", "WORKER"], // Tiene ambos roles
  } as User,
  isBootstrapping: false,
  switchRole: async (role: string) => console.log("Switched to", role)
});

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function WelcomeHeader() {
  const { isAuthenticated, user, isBootstrapping, switchRole } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const firstName = user?.name?.split(' ')[0] || '';
  const isProvider = user?.activeRole === 'WORKER';
  
  // FIX: Verificamos si tiene el perfil de trabajador en el array 'roles'
  // Usamos 'WORKER' que es el identificador correcto en la base de datos
  const hasWorkerProfile = user?.roles?.includes('WORKER');
  
  // El switch se muestra si está autenticado y posee el rol de proveedor en su cuenta
  const canSwitchRole = isAuthenticated && hasWorkerProfile;

  const handleSwitchRole = async () => {
    if (!canSwitchRole) return;
    
    setIsSwitchingRole(true);
    try {
      const newRole = isProvider ? 'CLIENT' : 'WORKER';
      await switchRole(newRole);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // Esqueleto de carga
  if (isBootstrapping) {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-slate-200 animate-pulse rounded-full" />
          <div className="h-8 w-40 bg-slate-200 animate-pulse rounded-lg" />
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-xs font-bold flex items-center gap-1.5 tracking-wide uppercase ${
              isProvider ? 'text-indigo-600' : 'text-blue-600'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              {isProvider ? 'Panel Profesional' : 'Explorar'}
            </p>
            
            {/* Badge de Rol actual */}
            {isAuthenticated && user && (
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                isProvider 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {isProvider ? 'Trabajador' : 'Cliente'}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
            {isAuthenticated && user ? `Hola, ${firstName}` : 'Bienvenido'}
          </h1>

          {/* Botón de cambio de rol: Solo si tiene perfil PROVIDER habilitado */}
          {canSwitchRole && (
            <button
              onClick={handleSwitchRole}
              disabled={isSwitchingRole}
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                isProvider
                  ? 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                  : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
              } disabled:opacity-50 active:scale-95`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {isSwitchingRole 
                ? 'Cambiando...' 
                : isProvider 
                  ? 'Modo Cliente' 
                  : 'Modo Profesional'
              }
            </button>
          )}
        </div>
        
        {/* Avatar o Botón de Acceso */}
        <div className="ml-4">
          {isAuthenticated && user ? (
            <UserAvatar 
              name={user.name} 
              avatar={user.avatar}
              size="md"
            />
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl shadow-slate-200 transition active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Acceso
            </button>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

// Exportación para visualización
export function App() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        <WelcomeHeader />
        <div className="mt-12 p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-300 font-medium">
          Contenido de la página...
        </div>
      </div>
    </div>
  );
}
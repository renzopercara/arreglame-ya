"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import { Sparkles, User as UserIcon, ArrowLeftRight } from "lucide-react";

export default function WelcomeHeader() {
  const { isAuthenticated, user, isBootstrapping, switchRole } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Empty string is intentional - when not authenticated, the header shows "Inicie sesión"
  // and firstName is not displayed, avoiding any confusing "guest" terminology
  const firstName = user?.name?.split(' ')[0] || '';
  const isProvider = user?.activeRole === 'PROVIDER';
  
  // Check if user has both profiles by checking role - users with WORKER role have worker profile
  // Users who have upgraded to WORKER still maintain their client capabilities
  const hasWorkerProfile = user?.role === 'WORKER';
  // All users can act as clients, but explicit CLIENT role means they haven't upgraded yet
  const hasClientProfile = true; // All users can use client features

  // Show role switch only if user has worker profile (has been upgraded to WORKER role)
  const canSwitchRole = isAuthenticated && hasWorkerProfile;

  const handleSwitchRole = async () => {
    if (!canSwitchRole) return;
    
    setIsSwitchingRole(true);
    try {
      const newRole = isProvider ? 'CLIENT' : 'PROVIDER';
      await switchRole(newRole);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // Show skeleton during bootstrap (BLOCK 1)
  if (isBootstrapping) {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-32 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg mt-2" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold flex items-center gap-1 ${
              isProvider ? 'text-green-600' : 'text-blue-600'
            }`}>
              <Sparkles className="w-4 h-4" />
              {isProvider ? 'Panel de Servicios' : 'Descubre'}
            </p>
            
            {/* Role Badge */}
            {isAuthenticated && user && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                isProvider 
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                {isProvider ? 'Profesional' : 'Cliente'}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {isAuthenticated && user ? `Hola, ${firstName}` : 'Bienvenido'}
          </h1>

          {/* Role Switch Button - Only show if user has both profiles */}
          {canSwitchRole && (
            <button
              onClick={handleSwitchRole}
              disabled={isSwitchingRole}
              className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isProvider
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {isSwitchingRole 
                ? 'Cambiando...' 
                : isProvider 
                  ? 'Cambiar a Cliente' 
                  : 'Cambiar a Profesional'
              }
            </button>
          )}
        </div>
        
        {/* BLOCK 4: Dynamic UI based on auth state */}
        {isAuthenticated && user ? (
          // Authenticated: Show UserAvatar (BLOCK 5)
          <UserAvatar 
            name={user.name} 
            avatar={user.avatar}
            size="md"
          />
        ) : (
          // Not authenticated: Show "Acceso" button
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition active:scale-95"
          >
            <UserIcon className="w-4 h-4" />
            Acceso
          </button>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // Modal will close automatically, session is now active
        }}
      />
    </>
  );
}

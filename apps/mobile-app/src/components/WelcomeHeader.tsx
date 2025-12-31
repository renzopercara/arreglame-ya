"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import { Sparkles, User as UserIcon } from "lucide-react";

export default function WelcomeHeader() {
  const { isAuthenticated, user, isBootstrapping } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const firstName = user?.name?.split(' ')[0] || '';
  const isProvider = user?.activeRole === 'PROVIDER';

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
          <p className="text-sm font-semibold text-blue-600 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            {isProvider ? 'Panel de Servicios' : 'Descubre'}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isAuthenticated && user ? `Hola, ${firstName}` : 'Inicie sesión'}
          </h1>
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

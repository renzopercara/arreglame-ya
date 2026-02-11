"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Briefcase, ShoppingBag, Loader2, UserCircle, Plus } from "lucide-react";
import { useAuth } from "@/app/providers";

/**
 * RoleSwitcher - Enhanced Role Switcher Component
 * 
 * Features:
 * - Avatar display with role badge
 * - Visual distinction between CLIENT and WORKER modes
 * - Shows available roles
 * - Option to add professional profile
 */
export default function RoleSwitcher() {
  const router = useRouter();
  const { user, isAuthenticated, hasWorkerRole, switchRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const isProviderMode = user.activeRole === 'WORKER';
  const currentColor = isProviderMode ? 'emerald' : 'blue';

  const handleSwitch = async (targetRole: 'CLIENT' | 'WORKER') => {
    setShowMenu(false);
    setIsSwitching(true);
    
    try {
      if (targetRole === 'WORKER') {
        // Switch to WORKER mode
        if (hasWorkerRole) {
          // User already has WORKER role - instant switch
          await switchRole('WORKER');
          router.push('/worker/dashboard');
        } else {
          // User doesn't have WORKER role - redirect to onboarding
          router.push('/worker/onboarding');
        }
      } else {
        // Switch to CLIENT mode (always available)
        await switchRole('CLIENT');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      {/* Main Switcher Button - Shows current mode */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isSwitching}
        className={`
          fixed bottom-24 right-6 z-40
          flex items-center gap-2 px-4 py-3
          rounded-2xl font-bold text-sm
          shadow-xl transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95
          ${isProviderMode 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}
        `}
        aria-label="Cambiar modo"
      >
        {isSwitching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cambiando...</span>
          </>
        ) : (
          <>
            <UserCircle className="w-4 h-4" />
            <span>{isProviderMode ? 'Modo Profesional' : 'Modo Cliente'}</span>
            <ArrowLeftRight className="w-3 h-3" />
          </>
        )}
      </button>

      {/* Role Selection Menu */}
      {showMenu && !isSwitching && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="fixed bottom-44 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 min-w-[240px] border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Cambiar Modo
            </h3>

            <div className="flex flex-col gap-2">
              {/* Client Mode Option */}
              <button
                onClick={() => handleSwitch('CLIENT')}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all
                  ${!isProviderMode 
                    ? 'bg-blue-50 border-2 border-blue-600 text-blue-900' 
                    : 'bg-slate-50 border-2 border-transparent text-slate-700 hover:bg-slate-100'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${!isProviderMode ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}
                `}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm">Cliente</div>
                  <div className="text-xs opacity-70">Buscar servicios</div>
                </div>
                {!isProviderMode && (
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {/* Provider Mode Option */}
              {hasWorkerRole ? (
                <button
                  onClick={() => handleSwitch('WORKER')}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isProviderMode 
                      ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-900' 
                      : 'bg-slate-50 border-2 border-transparent text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${isProviderMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}
                  `}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">Profesional</div>
                    <div className="text-xs opacity-70">Ofrecer servicios</div>
                  </div>
                  {isProviderMode && (
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleSwitch('WORKER')}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 text-emerald-900 hover:from-emerald-100 hover:to-emerald-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">Ser Profesional</div>
                    <div className="text-xs opacity-70">Regístrate ahora</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Briefcase, ShoppingBag, Loader2 } from "lucide-react";
import { useAuth } from "@/app/providers";

/**
 * RoleSwitcher - Global Role Switcher Component
 * 
 * Allows users to switch between CLIENT and PROVIDER roles
 * - If user has BOTH roles: Instant switch
 * - If user has CLIENT only: Redirect to professional onboarding
 * - If user has PROVIDER only: Instant switch to CLIENT
 */
export default function RoleSwitcher() {
  const router = useRouter();
  const { user, isAuthenticated, hasWorkerRole, switchRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const isProviderMode = user.activeRole === 'PROVIDER';

  const handleSwitch = async () => {
    setIsSwitching(true);
    
    try {
      if (isProviderMode) {
        // Switch to CLIENT mode (always available)
        await switchRole('CLIENT');
        router.push('/');
      } else {
        // Switch to PROVIDER mode
        if (hasWorkerRole) {
          // User already has WORKER role - instant switch
          await switchRole('PROVIDER');
          router.push('/worker/dashboard');
        } else {
          // User doesn't have WORKER role - redirect to onboarding
          router.push('/worker/onboarding');
        }
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const targetRole = isProviderMode ? 'Cliente' : 'Profesional';
  const TargetIcon = isProviderMode ? ShoppingBag : Briefcase;
  const buttonColor = isProviderMode 
    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200';

  return (
    <button
      onClick={handleSwitch}
      disabled={isSwitching}
      className={`
        fixed bottom-24 right-6 z-40
        flex items-center gap-2 px-4 py-3
        rounded-2xl font-bold text-sm
        shadow-xl transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${buttonColor}
      `}
      aria-label={`Cambiar a modo ${targetRole}`}
    >
      {isSwitching ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Cambiando...</span>
        </>
      ) : (
        <>
          <TargetIcon className="w-4 h-4" />
          <span>Modo {targetRole}</span>
        </>
      )}
    </button>
  );
}

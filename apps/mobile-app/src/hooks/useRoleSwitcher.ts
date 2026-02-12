"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

/**
 * Custom hook for handling role switching with proper state management
 * and navigation. Ensures activeRole is updated before redirecting.
 * 
 * @returns {object} Hook state and methods
 * @property {boolean} isSwitchingRole - Whether a role switch is in progress
 * @property {function} switchToWorker - Switches to WORKER role and redirects to worker dashboard
 * @property {function} switchToClient - Switches to CLIENT role and redirects to home
 */
export function useRoleSwitcher() {
  const router = useRouter();
  const { user, switchRole, hasWorkerRole } = useAuth();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const switchToWorker = useCallback(async () => {
    if (!user) return;
    
    setIsSwitchingRole(true);
    
    try {
      if (hasWorkerRole) {
        // User has worker role - switch to it
        await switchRole('WORKER');
        router.push('/worker/dashboard');
      } else {
        // User doesn't have worker role - redirect to onboarding
        router.push('/worker/onboarding');
      }
    } catch (error) {
      console.error('Failed to switch to worker role:', error);
    } finally {
      setIsSwitchingRole(false);
    }
  }, [user, hasWorkerRole, switchRole, router]);

  const switchToClient = useCallback(async () => {
    if (!user) return;
    
    setIsSwitchingRole(true);
    
    try {
      await switchRole('CLIENT');
      router.push('/');
    } catch (error) {
      console.error('Failed to switch to client role:', error);
    } finally {
      setIsSwitchingRole(false);
    }
  }, [user, switchRole, router]);

  return {
    isSwitchingRole,
    switchToWorker,
    switchToClient,
  };
}

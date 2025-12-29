"use client";

import { useState } from "react";
import usePaymentReadiness from "./usePaymentReadiness";

interface ProtectedActionOptions {
  requirePaymentMethod?: boolean; // For clients
  requireMpConnection?: boolean; // For workers
  onAuthRequired?: () => void;
  onPaymentSetupRequired?: () => void;
}

export default function useProtectedAction() {
  const { isLogged, role, hasPaymentMethod, isMpConnected } = usePaymentReadiness();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);

  const executeProtected = (
    callback: () => void | Promise<void>,
    options: ProtectedActionOptions = {}
  ) => {
    // Step 1: Check authentication
    if (!isLogged) {
      if (options.onAuthRequired) {
        options.onAuthRequired();
      } else {
        setShowAuthModal(true);
      }
      return;
    }

    // Step 2: Check payment readiness for clients
    if (role === "CLIENT" && options.requirePaymentMethod && !hasPaymentMethod) {
      if (options.onPaymentSetupRequired) {
        options.onPaymentSetupRequired();
      } else {
        setShowPaymentBanner(true);
      }
      return;
    }

    // Step 3: Check MP connection for workers
    if (role === "WORKER" && options.requireMpConnection && !isMpConnected) {
      if (options.onPaymentSetupRequired) {
        options.onPaymentSetupRequired();
      } else {
        setShowPaymentBanner(true);
      }
      return;
    }

    // All checks passed, execute callback
    callback();
  };

  return {
    executeProtected,
    showAuthModal,
    setShowAuthModal,
    showPaymentBanner,
    setShowPaymentBanner,
    isLogged,
    role,
  };
}

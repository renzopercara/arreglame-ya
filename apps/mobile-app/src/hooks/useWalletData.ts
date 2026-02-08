/**
 * useWalletData Hook
 * 
 * Manages wallet balance and debt information
 * Derives debt from wallet currentBalance (negative balance = debt)
 */

import { useMemo } from 'react';

interface User {
  balance?: number;
  wallet?: {
    currentBalance?: number; // Balance in centavos
    balanceAvailable?: number;
    balancePending?: number;
    debtLimit?: number;
  };
}

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  cashDebt: number;
  debtLimit: number;
  isOverDebtLimit: boolean;
  hasDebt: boolean;
}

/**
 * Hook to calculate wallet data from user object
 * 
 * @param user - User object with balance/wallet information
 * @returns Calculated wallet data including debt information
 */
export function useWalletData(user: User | null): WalletData {
  return useMemo(() => {
    // Default values when no user or no wallet
    if (!user) {
      return {
        availableBalance: 0,
        pendingBalance: 0,
        cashDebt: 0,
        debtLimit: 50000, // Default 50,000 centavos = $500 ARS
        isOverDebtLimit: false,
        hasDebt: false,
      };
    }

    // Extract wallet data
    const availableBalance = user.balance ?? 0;
    const pendingBalance = user.wallet?.balancePending ? Number(user.wallet.balancePending) : 0;
    
    // Calculate debt from currentBalance (negative balance = debt)
    // currentBalance is in centavos, convert to ARS (divide by 100)
    const currentBalanceCentavos = user.wallet?.currentBalance ?? 0;
    const cashDebt = currentBalanceCentavos < 0 ? Math.abs(currentBalanceCentavos) / 100 : 0;
    
    // Debt limit in centavos, convert to ARS
    const debtLimitCentavos = user.wallet?.debtLimit ?? -50000;
    const debtLimit = Math.abs(debtLimitCentavos) / 100;
    
    // Check if over debt limit (currentBalance is more negative than debtLimit)
    const isOverDebtLimit = currentBalanceCentavos < debtLimitCentavos;
    
    return {
      availableBalance,
      pendingBalance,
      cashDebt,
      debtLimit,
      isOverDebtLimit,
      hasDebt: cashDebt > 0,
    };
  }, [user]);
}

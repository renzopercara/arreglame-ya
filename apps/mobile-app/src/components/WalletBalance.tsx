'use client';

import React from 'react';
import { Wallet, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

interface WalletBalanceProps {
  availableBalance: number;
  cashDebt: number;
  currency?: string;
  onSettleDebt?: () => void;
}

export default function WalletBalance({ 
  availableBalance, 
  cashDebt, 
  currency = 'ARS',
  onSettleDebt 
}: WalletBalanceProps) {
  const hasDebt = cashDebt > 0;
  const netBalance = availableBalance - cashDebt;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 shadow-lg shadow-indigo-100 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 opacity-90" />
          <p className="text-sm font-medium opacity-90">Tu Wallet</p>
        </div>
        {hasDebt && (
          <span className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-100 border border-amber-400/30">
            <AlertCircle className="h-3 w-3" />
            Deuda pendiente
          </span>
        )}
      </div>

      {/* Available Balance */}
      <div className="space-y-1">
        <p className="text-xs font-medium opacity-80">Saldo Disponible</p>
        <p className="text-3xl font-bold tracking-tight">
          {formatCurrency(availableBalance)}
        </p>
        <p className="text-xs opacity-70">
          Cobrado por servicios en la app
        </p>
      </div>

      {/* Cash Debt Section */}
      {hasDebt && (
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-300" />
              <p className="text-xs font-semibold text-amber-100">Deuda por Efectivo</p>
            </div>
            <p className="text-sm font-bold text-amber-100">
              {formatCurrency(cashDebt)}
            </p>
          </div>
          <p className="text-xs opacity-70 mb-3">
            Comisiones pendientes de servicios en efectivo
          </p>
          
          {onSettleDebt && (
            <button
              onClick={onSettleDebt}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/90 backdrop-blur px-4 py-3 text-sm font-bold text-indigo-700 shadow-md hover:bg-white active:scale-95 transition-all"
            >
              Liquidar Deuda
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Net Balance */}
      {hasDebt && (
        <div className="pt-3 border-t border-white/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Balance Neto</p>
            <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

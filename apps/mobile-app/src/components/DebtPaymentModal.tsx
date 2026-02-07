'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { initiateDebtPayment } from '../services/mercadopago.service';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtAmount: number;
  userId: string;
  currency?: string;
}

export default function DebtPaymentModal({
  isOpen,
  onClose,
  debtAmount,
  userId,
  currency = 'ARS',
}: DebtPaymentModalProps) {
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handlePayDebt = async () => {
    setLoading(true);
    try {
      const { initPoint } = await initiateDebtPayment(userId, debtAmount);
      
      // Redirect to Mercado Pago payment page
      window.location.href = initPoint;
    } catch (error) {
      console.error('Error initiating debt payment:', error);
      toast.error('Error al procesar el pago. Intenta nuevamente.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Liquidar Deuda de Comisiones
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Debes liquidar las comisiones pendientes de servicios cobrados en efectivo para continuar operando.
            </p>
          </div>
        </div>

        {/* Debt Summary */}
        <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-amber-900">Total a pagar</p>
            <p className="text-2xl font-bold text-amber-900">
              {formatCurrency(debtAmount)}
            </p>
          </div>
          <p className="text-xs text-amber-800">
            Comisiones acumuladas por servicios en efectivo
          </p>
        </div>

        {/* Payment Info */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-900 mb-1">
                Pago Seguro con Mercado Pago
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Serás redirigido a Mercado Pago para completar el pago de forma segura. 
                Puedes usar tarjeta de crédito, débito o saldo en cuenta.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handlePayDebt}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Pagar con Mercado Pago
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-2xl bg-slate-100 px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

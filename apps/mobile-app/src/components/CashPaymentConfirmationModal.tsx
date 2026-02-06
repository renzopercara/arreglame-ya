'use client';

import React from 'react';
import { AlertTriangle, Banknote, TrendingDown, X } from 'lucide-react';

interface CashPaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName?: string;
  amount: number;
  commissionAmount: number;
  commissionPercentage: number;
  currency?: string;
}

export default function CashPaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName = 'este servicio',
  amount,
  commissionAmount,
  commissionPercentage,
  currency = 'ARS'
}: CashPaymentConfirmationModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const netAmount = amount - commissionAmount;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={20} />
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border-2 border-amber-200">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2 text-slate-900 text-center">
          Confirmar Pago en Efectivo
        </h2>
        <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
          Al marcar este servicio como pagado en efectivo, se generará una comisión en tu balance.
        </p>

        {/* Service Details */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Desglose de Pago
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Servicio:</p>
              <p className="text-sm font-semibold text-slate-900 text-right max-w-[60%] truncate">
                {serviceName}
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Monto total:</p>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(amount)}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <TrendingDown className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">Comisión ({commissionPercentage}%):</p>
                </div>
                <p className="text-sm font-bold text-amber-700">
                  -{formatCurrency(commissionAmount)}
                </p>
              </div>
              <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                Esta comisión quedará registrada como deuda en tu balance
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-900">Recibirás:</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(netAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-3 mb-6 border border-blue-100">
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-bold">Nota:</span> Los pagos digitales a través de Mercado Pago 
            tienen comisiones más bajas y se acreditan automáticamente.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition shadow-md shadow-amber-100"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

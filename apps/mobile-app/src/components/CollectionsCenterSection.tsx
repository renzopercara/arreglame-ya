'use client';

import React, { useState } from 'react';
import { Briefcase, Link as LinkIcon, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import WalletBalance from './WalletBalance';

interface CollectionsCenterSectionProps {
  isMercadoPagoConnected: boolean;
  availableBalance?: number;
  cashDebt?: number;
  onConnectMercadoPago?: () => void;
  onSettleDebt?: () => void;
}

export default function CollectionsCenterSection({ 
  isMercadoPagoConnected,
  availableBalance = 0,
  cashDebt = 0,
  onConnectMercadoPago,
  onSettleDebt
}: CollectionsCenterSectionProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleConnectClick = () => {
    if (onConnectMercadoPago) {
      onConnectMercadoPago();
    } else {
      toast.info('Funcionalidad de vinculación en desarrollo');
    }
  };

  const handleSettleDebt = () => {
    if (onSettleDebt) {
      onSettleDebt();
    } else {
      toast.info('Funcionalidad de liquidación en desarrollo');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isMercadoPagoConnected ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <Briefcase className={`h-5 w-5 ${isMercadoPagoConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Centro de Cobros</p>
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="relative"
                >
                  <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 transition" />
                  {showTooltip && (
                    <div className="absolute left-0 top-6 z-10 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-lg">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                        <p className="leading-relaxed">
                          Todos los cobros digitales se procesan de forma segura a través de Mercado Pago. Tus datos financieros están protegidos.
                        </p>
                      </div>
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 transform rotate-45" />
                    </div>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {isMercadoPagoConnected ? 'Sistema activo' : 'Vinculación pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Warning/Success */}
        {!isMercadoPagoConnected ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    Vinculación Obligatoria
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Vincular Mercado Pago es obligatorio para recibir pagos digitales. 
                    Sin esta configuración, solo podrás aceptar pagos en efectivo.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnectClick}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <LinkIcon className="h-4 w-4" />
              Vincular Mercado Pago
            </button>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Mercado Pago Vinculado
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Ya puedes recibir pagos digitales de forma segura
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Wallet Balance - Only shown if connected */}
      {isMercadoPagoConnected && (
        <WalletBalance 
          availableBalance={availableBalance}
          cashDebt={cashDebt}
          onSettleDebt={cashDebt > 0 ? handleSettleDebt : undefined}
        />
      )}
    </div>
  );
}

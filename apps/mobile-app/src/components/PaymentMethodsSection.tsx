'use client';

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethodsSectionProps {
  isMercadoPagoConnected: boolean;
  onConfigurePayments?: () => void;
}

export default function PaymentMethodsSection({ 
  isMercadoPagoConnected,
  onConfigurePayments 
}: PaymentMethodsSectionProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleConfigureClick = () => {
    if (onConfigurePayments) {
      onConfigurePayments();
    } else {
      toast.info('Funcionalidad de configuración en desarrollo');
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isMercadoPagoConnected ? 'bg-emerald-50' : 'bg-blue-50'}`}>
            <CreditCard className={`h-5 w-5 ${isMercadoPagoConnected ? 'text-emerald-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">Métodos de Pago</p>
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
                        Nosotros no guardamos tus datos de tarjeta. Todo el procesamiento se realiza de forma encriptada a través de Mercado Pago.
                      </p>
                    </div>
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 transform rotate-45" />
                  </div>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {isMercadoPagoConnected ? 'Configurado' : 'Configura tus pagos'}
            </p>
          </div>
        </div>
        {isMercadoPagoConnected ? (
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-blue-500" />
        )}
      </div>

      {isMercadoPagoConnected ? (
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">Pagos rápidos activados</p>
              <p className="text-xs text-emerald-700 mt-1">
                Tus datos están protegidos por Mercado Pago
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-800 font-medium mb-2">
              Configura pagos rápidos para una mejor experiencia
            </p>
            <p className="text-xs text-blue-700">
              Esto es <span className="font-bold">opcional</span> y tus datos están protegidos por Mercado Pago.
            </p>
          </div>
          
          <button
            onClick={handleConfigureClick}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <CreditCard className="h-4 w-4" />
            Configurar pagos rápidos con Mercado Pago
          </button>
        </>
      )}
    </section>
  );
}

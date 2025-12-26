import React, { useState } from 'react';
import { formatCurrency } from '../services/mockBackend';
import { CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentGatewayProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ amount, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setIsProcessing(true);

    // Simulate Payment API call (Stripe/PayPal)
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setStep('success');
    
    // Auto close after success
    setTimeout(() => {
        onSuccess();
    }, 1500);
  };

  if (step === 'success') {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-8 text-center animate-in zoom-in duration-300">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-800">¡Pago Exitoso!</h2>
                  <p className="text-slate-500 mt-2">Transacción #TX-{Math.floor(Math.random()*100000)}</p>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Lock size={16} className="text-green-600" /> Pago Seguro
                </h3>
                <p className="text-xs text-slate-400">Encriptación SSL de 256-bits</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-slate-500">Total a pagar</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(amount)}</p>
            </div>
        </div>

        {step === 'processing' ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <p>Procesando pago...</p>
                <p className="text-xs mt-2">Contactando con el banco</p>
            </div>
        ) : (
            <form onSubmit={handlePay} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Número de Tarjeta</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                            required
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vencimiento</label>
                        <input 
                            required
                            type="text" 
                            placeholder="MM/AA" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">CVC</label>
                        <input 
                            required
                            type="text" 
                            placeholder="123" 
                            maxLength={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                        />
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="flex-[2] bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                    >
                        Pagar {formatCurrency(amount)}
                    </button>
                </div>
                
                <p className="text-[10px] text-center text-slate-400 mt-2">
                    Pagos procesados por MockStripe. No se le cobrará nada real.
                </p>
            </form>
        )}
      </div>
    </div>
  );
};
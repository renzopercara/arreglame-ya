import React from 'react';
import { MapPin, AlertTriangle, Navigation } from 'lucide-react';

interface GPSPermissionModalProps {
  onEnable: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const GPSPermissionModal: React.FC<GPSPermissionModalProps> = ({ onEnable, onSkip, isLoading }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500" />

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Navigation className="text-orange-600" size={32} />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Activá tu GPS</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Para conectarte con jardineros o clientes cercanos, necesitamos acceder a tu ubicación precisa.
          </p>

          <div className="space-y-3 w-full">
            <button
              onClick={onEnable}
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {isLoading ? (
                <span>Buscando satélites...</span>
              ) : (
                <>
                  <MapPin size={18} /> Activar Ubicación
                </>
              )}
            </button>

            <button
              onClick={onSkip}
              className="w-full py-3.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors text-sm"
            >
              Continuar sin GPS
            </button>
          </div>

          <div className="mt-6 flex items-start gap-2 bg-slate-50 p-3 rounded-lg text-left">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400">
              <span className="font-bold text-slate-600">Atención:</span> Si continuás sin GPS, deberás ingresar direcciones manualmente y tu prioridad de asignación será menor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

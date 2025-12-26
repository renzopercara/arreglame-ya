
import React, { useState, useEffect } from 'react';
import { GeoService } from '../lib/adapters/geo';
import { NotificationAdapter } from '../lib/adapters/notifications';
import { MapPin, Bell, ChevronRight, Check, X } from 'lucide-react';

interface PermissionFlowProps {
  onComplete: () => void;
}

type Step = 'CHECKING' | 'GPS' | 'NOTIFICATIONS' | 'DONE';

export const PermissionFlow: React.FC<PermissionFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('CHECKING');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    // 1. Check GPS
    const gpsStatus = await GeoService.checkPermissions();
    if (gpsStatus !== 'granted') {
      setStep('GPS');
      return;
    }

    // 2. Check Notifications
    const pushStatus = await NotificationAdapter.checkPermission();
    if (pushStatus === 'prompt') { // Only ask if not already denied or granted
      setStep('NOTIFICATIONS');
      return;
    }

    // 3. All good or denied previously
    onComplete();
  };

  const nextStep = async () => {
    setIsAnimating(true);
    setTimeout(async () => {
      if (step === 'GPS') {
        const pushStatus = await NotificationAdapter.checkPermission();
        if (pushStatus === 'prompt') {
            setStep('NOTIFICATIONS');
        } else {
            onComplete();
        }
      } else if (step === 'NOTIFICATIONS') {
        onComplete();
      }
      setIsAnimating(false);
    }, 300); // Match CSS transition
  };

  const handleRequestGPS = async () => {
    try {
      await GeoService.requestPermissions();
      // Even if denied, we move on (App handles manual mode)
      nextStep(); 
    } catch (e) {
      console.error(e);
      nextStep();
    }
  };

  const handleRequestPush = async () => {
    try {
      await NotificationAdapter.requestPermission();
      nextStep();
    } catch (e) {
      console.error(e);
      nextStep();
    }
  };

  if (step === 'CHECKING' || step === 'DONE') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-6">
      <div 
        className={`bg-white w-full max-w-sm mx-auto h-[60vh] sm:h-auto sm:rounded-3xl rounded-t-3xl p-8 shadow-2xl flex flex-col transition-opacity duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        {/* PROGRESS INDICATOR */}
        <div className="flex gap-2 mb-8 justify-center">
            <div className={`h-1.5 w-8 rounded-full ${step === 'GPS' ? 'bg-green-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 w-8 rounded-full ${step === 'NOTIFICATIONS' ? 'bg-green-600' : 'bg-slate-200'}`} />
        </div>

        {step === 'GPS' && (
            <div className="flex-1 flex flex-col items-center text-center animate-in slide-in-from-right duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <MapPin className="text-green-600" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Activa tu ubicación</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Para conectar con jardineros cercanos y mostrarte el precio exacto en tu zona, necesitamos acceso al GPS.
                </p>
                <div className="mt-auto w-full space-y-3">
                    <button 
                        onClick={handleRequestGPS}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Permitir acceso <ChevronRight size={20}/>
                    </button>
                    <button 
                        onClick={nextStep}
                        className="w-full py-3 text-slate-400 font-bold hover:text-slate-600"
                    >
                        Ingresar dirección manualmente
                    </button>
                </div>
            </div>
        )}

        {step === 'NOTIFICATIONS' && (
            <div className="flex-1 flex flex-col items-center text-center animate-in slide-in-from-right duration-500">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Bell className="text-blue-600" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">No te pierdas nada</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Recibí avisos cuando el cortador esté en camino, llegue a tu casa o termine el trabajo.
                </p>
                <div className="mt-auto w-full space-y-3">
                    <button 
                        onClick={handleRequestPush}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Activar notificaciones <Check size={20}/>
                    </button>
                    <button 
                        onClick={nextStep}
                        className="w-full py-3 text-slate-400 font-bold hover:text-slate-600"
                    >
                        Ahora no
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

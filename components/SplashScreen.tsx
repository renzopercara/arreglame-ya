import React from 'react';
import { Loader2, Leaf } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-green-600 flex flex-col items-center justify-center text-white z-[9999]">
      <div className="animate-in zoom-in duration-500 flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <Leaf className="text-green-600" size={48} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Arreglame Ya</h1>
        <p className="text-green-100 text-sm font-medium tracking-widest uppercase mb-8">Jardinería On-Demand</p>
        <Loader2 className="animate-spin text-white/80" size={32} />
      </div>
      
      <div className="absolute bottom-8 text-xs text-green-200 opacity-60">
        v1.0.0 (MVP)
      </div>
    </div>
  );
};
import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-6 text-center">
      <div className="bg-white p-6 rounded-full shadow-lg mb-6">
        <WifiOff size={48} className="text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Sin Conexión</h1>
      <p className="text-slate-500 mb-8">
        Parece que perdiste la conexión a internet. 
        Revisá tu señal para continuar usando Arreglame Ya.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
      >
        Reintentar
      </button>
    </div>
  );
}
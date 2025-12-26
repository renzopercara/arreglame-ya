
import React, { useState } from 'react';
import { UserRole } from '../types';
import { getLegalText, LEGAL_VERSIONS } from '../lib/constants/legal';
import { ShieldCheck, X, FileText } from 'lucide-react';

interface TermsModalProps {
  role: UserRole;
  onAccept: (metadata: { version: string, userAgent: string, date: string }) => void;
  onCancel: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ role, onAccept, onCancel }) => {
  const [isChecked, setIsChecked] = useState(false);
  const text = getLegalText(role);
  const version = role === UserRole.WORKER ? LEGAL_VERSIONS.WORKER : LEGAL_VERSIONS.CLIENT;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="text-green-600" size={24} />
                <span>Acuerdo Legal</span>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
            </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium bg-slate-50/30">
            {text}
        </div>

        <div className="p-6 bg-white border-t">
            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                <input 
                    type="checkbox" 
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                />
                <span className="text-[11px] text-slate-500 leading-tight">
                    He leído y acepto los Términos y Condiciones. Declaro bajo juramento ser trabajador independiente y poseer cobertura de Accidentes Personales.
                </span>
            </label>

            <button 
                onClick={() => onAccept({ version, userAgent: navigator.userAgent, date: new Date().toISOString() })}
                disabled={!isChecked}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-all"
            >
                Aceptar y Continuar
            </button>
        </div>
      </div>
    </div>
  );
};

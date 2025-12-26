
import React from 'react';
import { ShieldCheck, Award, MapPin, Briefcase } from 'lucide-react';
import { WorkerTier } from '../types';
import { StarRating } from './StarRating';

interface WorkerProfileCardProps {
    worker: {
        name: string;
        rating: number;
        totalJobs: number;
        currentPlan: WorkerTier;
        bio?: string;
    };
    onClose?: () => void;
}

export const WorkerProfileCard: React.FC<WorkerProfileCardProps> = ({ worker, onClose }) => {
    
    const isElite = worker.currentPlan === WorkerTier.ELITE;
    const isPro = worker.currentPlan === WorkerTier.PRO;

    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            {/* Header / Banner */}
            <div className={`h-24 ${isElite ? 'bg-gradient-to-r from-yellow-400 to-amber-600' : isPro ? 'bg-gradient-to-r from-slate-400 to-slate-600' : 'bg-gradient-to-r from-green-500 to-emerald-700'}`}>
                {onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 text-white p-1 rounded-full backdrop-blur-sm">✕</button>
                )}
            </div>

            <div className="px-6 pb-6 -mt-12 relative">
                {/* Avatar & Badges */}
                <div className="flex justify-between items-end mb-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-4xl overflow-hidden">
                        {/* Placeholder Avatar - En prod usar worker.avatarUrl */}
                        <span className="font-bold text-slate-300">{worker.name.charAt(0)}</span>
                    </div>
                    {isElite && (
                        <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                            <Award size={14} /> Elite Partner
                        </div>
                    )}
                    {isPro && (
                        <div className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                            <ShieldCheck size={14} /> Pro Worker
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-slate-900">{worker.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={worker.rating} size={16} readonly />
                    <span className="text-sm font-bold text-slate-500">({worker.totalJobs} trabajos)</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                        "{worker.bio || "Cortador comprometido con la calidad y la puntualidad."}"
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-xl flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full text-green-600 shadow-sm"><ShieldCheck size={16}/></div>
                        <div>
                            <p className="text-[10px] text-green-800 font-bold uppercase">Identidad</p>
                            <p className="text-xs font-bold text-green-600">Verificada</p>
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm"><Briefcase size={16}/></div>
                        <div>
                            <p className="text-[10px] text-blue-800 font-bold uppercase">Seguro</p>
                            <p className="text-xs font-bold text-blue-600">Al día</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ChevronLeft, TrendingUp, DollarSign, ArrowRight, Wallet, AlertCircle, Building2, Download, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../../../services/mockBackend';


interface EarningsViewProps {
  currentBalance: number;
  onBack: () => void;
}

// MOCK DATA
const WEEKLY_DATA = [
    { day: 'Lun', amount: 12000 },
    { day: 'Mar', amount: 8500 },
    { day: 'Mié', amount: 15400 },
    { day: 'Jue', amount: 0 },
    { day: 'Vie', amount: 22100 },
    { day: 'Sáb', amount: 35000 },
    { day: 'Dom', amount: 18000 },
];

const RECENT_TX: Transaction[] = [
    { id: '1', amount: 15000, type: TransactionType.DEPOSIT, date: Date.now() - 3600000, description: 'Pago Trabajo #8812', status: 'COMPLETED' },
    { id: '2', amount: 2000, type: TransactionType.TIP, date: Date.now() - 3600000, description: 'Propina Cliente', status: 'COMPLETED' },
    { id: '3', amount: -4250, type: TransactionType.FEE, date: Date.now() - 3600000, description: 'Comisión Plataforma (25%)', status: 'COMPLETED' },
    { id: '4', amount: -25000, type: TransactionType.WITHDRAWAL, date: Date.now() - 86400000, description: 'Retiro a Banco Galicia', status: 'COMPLETED' },
];

export const EarningsView: React.FC<EarningsViewProps> = ({ currentBalance, onBack }) => {
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [cbu, setCbu] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const maxVal = Math.max(...WEEKLY_DATA.map(d => d.amount));

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Simular API Call
        setTimeout(() => {
            setIsProcessing(false);
            setShowWithdraw(false);
            setSuccessMsg("¡Solicitud enviada! Recibirás el dinero en 24hs hábiles.");
            setTimeout(() => setSuccessMsg(''), 5000);
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right">
            {/* Header / Navbar */}
            <div className="bg-slate-900 text-white px-6 pt-6 pb-8 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                
                <div className="relative z-10">
                    <button onClick={onBack} className="absolute top-0 left-0 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center mt-4">
                        <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-1">Saldo Disponible</p>
                        <h1 className="text-4xl font-black tracking-tight">{formatCurrency(currentBalance)}</h1>
                        
                        <div className="flex gap-4 mt-6 w-full max-w-xs">
                             <button 
                                onClick={() => setShowWithdraw(true)}
                                className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-900/50 active:scale-95 transition-all flex items-center justify-center gap-2"
                             >
                                <Building2 size={16} /> Retirar
                             </button>
                             <div className="flex-1 bg-white/10 py-3 rounded-xl font-bold text-sm flex items-center justify-center flex-col">
                                <span className="text-[10px] text-slate-400 font-normal">Pendiente</span>
                                <span>$12.500</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 -mt-4 relative z-20">
                
                {successMsg && (
                    <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in zoom-in shadow-sm">
                        <CheckCircle size={20} className="shrink-0"/>
                        <p className="text-xs font-bold">{successMsg}</p>
                    </div>
                )}

                {/* Chart Section */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-600" /> Rendimiento Semanal
                        </h3>
                        <span className="text-xs font-bold text-slate-400">Ult. 7 días</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-32 gap-2">
                        {WEEKLY_DATA.map((d, i) => {
                            const height = (d.amount / maxVal) * 100;
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden h-full flex items-end">
                                        <div 
                                            style={{ height: `${height}%` }} 
                                            className={`w-full ${height === 100 ? 'bg-green-500' : 'bg-slate-300 group-hover:bg-green-300'} transition-all duration-500 rounded-t-lg`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{d.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Transactions */}
                <div>
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Wallet size={18} className="text-slate-400" /> Actividad
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
                        {RECENT_TX.map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full mt-0.5 ${
                                        tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.TIP 
                                        ? 'bg-green-100 text-green-600' 
                                        : tx.type === TransactionType.WITHDRAWAL 
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {tx.type === TransactionType.WITHDRAWAL ? <ArrowRight size={14}/> : <DollarSign size={14}/>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{tx.description}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${
                                    tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.TIP 
                                    ? 'text-green-600' 
                                    : 'text-slate-900'
                                }`}>
                                    {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.TIP ? '+' : ''}
                                    {formatCurrency(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
                         <h3 className="font-bold text-xl mb-4 text-slate-900">Solicitar Retiro</h3>
                         
                         <form onSubmit={handleWithdraw}>
                             <div className="bg-slate-50 p-4 rounded-xl mb-6 text-center border border-slate-200">
                                 <p className="text-xs text-slate-500 uppercase mb-1">Disponible</p>
                                 <p className="text-2xl font-black text-slate-800">{formatCurrency(currentBalance)}</p>
                             </div>

                             <div className="space-y-4 mb-6">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto a retirar</label>
                                     <div className="relative">
                                         <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span>
                                         <input 
                                            type="number" 
                                            required
                                            max={currentBalance}
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 rounded-xl font-bold border focus:border-green-500 outline-none" 
                                            placeholder="0"
                                         />
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CBU / CVU / Alias</label>
                                     <input 
                                        type="text" 
                                        required
                                        value={cbu}
                                        onChange={e => setCbu(e.target.value)}
                                        className="w-full p-3 bg-slate-50 rounded-xl text-sm border focus:border-green-500 outline-none" 
                                        placeholder="Ej: mi.alias.mp"
                                     />
                                 </div>
                             </div>

                             <div className="bg-orange-50 p-3 rounded-lg flex gap-2 mb-6">
                                 <AlertCircle className="text-orange-600 shrink-0" size={16} />
                                 <p className="text-[10px] text-orange-800 leading-tight">
                                     Las transferencias pueden demorar hasta 24hs hábiles. Verificá bien los datos de tu cuenta.
                                 </p>
                             </div>

                             <div className="flex gap-3">
                                 <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-3 font-bold text-slate-500 text-sm">Cancelar</button>
                                 <button type="submit" disabled={!withdrawAmount || !cbu || isProcessing} className="flex-[2] bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">
                                     {isProcessing ? 'Procesando...' : 'Confirmar Retiro'}
                                 </button>
                             </div>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
};

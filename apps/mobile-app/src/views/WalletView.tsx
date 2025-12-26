
import React, { useState } from 'react';
import { PaymentMethod, Transaction, TransactionType } from '../types';
import { CreditCard, Trash2, Plus, Download, History, ChevronLeft, Lock } from 'lucide-react';
import { formatCurrency } from '../../../../services/mockBackend';

interface WalletViewProps {
  onBack: () => void;
}

// MOCK DATA
const MOCK_CARDS: PaymentMethod[] = [
  { id: '1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 28, isDefault: true },
  { id: '2', brand: 'mastercard', last4: '8899', expMonth: 5, expYear: 26, isDefault: false },
];

const MOCK_HISTORY: Transaction[] = [
  { id: 't1', amount: -15400, type: TransactionType.PAYMENT, date: Date.now() - 86400000, description: 'Corte de Pasto #AB23', status: 'COMPLETED' },
  { id: 't2', amount: -2500, type: TransactionType.FEE, date: Date.now() - 172800000, description: 'Cargo por Cancelación', status: 'COMPLETED' },
  { id: 't3', amount: 15400, type: TransactionType.REFUND, date: Date.now() - 250000000, description: 'Reembolso Disputa #XY99', status: 'COMPLETED' },
];

export const WalletView: React.FC<WalletViewProps> = ({ onBack }) => {
  const [cards, setCards] = useState(MOCK_CARDS);
  const [showAddCard, setShowAddCard] = useState(false);

  // New Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: PaymentMethod = {
      id: Math.random().toString(),
      brand: 'visa', // Mock detection
      last4: cardNumber.slice(-4),
      expMonth: parseInt(cardExp.split('/')[0]),
      expYear: parseInt(cardExp.split('/')[1]),
      isDefault: cards.length === 0
    };
    setCards([...cards, newCard]);
    setShowAddCard(false);
    setCardNumber('');
    setCardExp('');
    setCardCvc('');
  };

  const handleDeleteCard = (id: string) => {
    if(confirm("¿Eliminar tarjeta?")) {
        setCards(cards.filter(c => c.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right">
      {/* Navbar */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24}/>
        </button>
        <h1 className="font-bold text-xl text-slate-800">Billetera</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Cards Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h2 className="font-bold text-slate-700">Mis Tarjetas</h2>
             <button 
                onClick={() => setShowAddCard(true)}
                className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
             >
                <Plus size={14}/> Agregar
             </button>
          </div>

          {showAddCard && (
             <form onSubmit={handleAddCard} className="bg-white p-4 rounded-2xl shadow-lg mb-4 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                 <div className="mb-3">
                    <input required maxLength={19} placeholder="Número de Tarjeta" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border focus:border-green-500 transition-colors" />
                 </div>
                 <div className="mb-3">
                    <input required placeholder="Nombre como figura en la tarjeta" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border focus:border-green-500 transition-colors" />
                 </div>
                 <div className="flex gap-3 mb-4">
                    <input required maxLength={5} placeholder="MM/AA" value={cardExp} onChange={e => setCardExp(e.target.value)} className="w-1/2 p-3 bg-slate-50 rounded-xl text-sm outline-none border focus:border-green-500 transition-colors" />
                    <input required maxLength={4} placeholder="CVC" value={cardCvc} onChange={e => setCardCvc(e.target.value)} className="w-1/2 p-3 bg-slate-50 rounded-xl text-sm outline-none border focus:border-green-500 transition-colors" />
                 </div>
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddCard(false)} className="flex-1 py-3 text-xs font-bold text-slate-500">Cancelar</button>
                    <button type="submit" className="flex-1 bg-green-600 text-white rounded-xl py-3 text-xs font-bold shadow-lg">Guardar Tarjeta</button>
                 </div>
                 <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                     <Lock size={10} /> Pagos procesados de forma segura
                 </div>
             </form>
          )}

          <div className="space-y-3">
             {cards.map(card => (
                 <div key={card.id} className="relative group overflow-hidden bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between h-32 transition-transform transform hover:scale-[1.02]">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                     
                     <div className="flex justify-between items-start z-10">
                        <span className="font-mono text-xs opacity-70">{card.brand.toUpperCase()}</span>
                        {card.isDefault && <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Principal</span>}
                     </div>
                     
                     <div className="z-10">
                        <p className="font-mono text-xl tracking-widest mb-1">•••• •••• •••• {card.last4}</p>
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] opacity-70">VENCE {card.expMonth}/{card.expYear}</p>
                            <button onClick={() => handleDeleteCard(card.id)} className="p-2 bg-white/10 rounded-full hover:bg-red-500/80 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                     </div>
                 </div>
             ))}
             {cards.length === 0 && !showAddCard && (
                 <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                     <CreditCard className="mx-auto mb-2 opacity-50" />
                     <p className="text-xs">No tenés tarjetas guardadas</p>
                 </div>
             )}
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <History size={18} className="text-slate-400"/>
             <h2 className="font-bold text-slate-700">Movimientos Recientes</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
             {MOCK_HISTORY.map(tx => (
                 <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                     <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                             {tx.amount > 0 ? <Download className="rotate-180" size={16}/> : <CreditCard size={16}/>}
                         </div>
                         <div>
                             <p className="text-sm font-bold text-slate-800">{tx.description}</p>
                             <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                         </div>
                     </div>
                     <div className="text-right">
                         <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                             {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                         </p>
                         <button className="text-[10px] text-blue-600 hover:underline flex items-center justify-end gap-1 mt-1">
                             <Download size={10}/> Factura
                         </button>
                     </div>
                 </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
};

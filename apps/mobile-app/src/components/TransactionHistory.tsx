'use client';

import React from 'react';
import { Receipt, Calendar, Banknote, CreditCard, TrendingDown } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  serviceName: string;
  paymentMethod: 'CASH' | 'MERCADOPAGO' | 'DIGITAL';
  amount: number;
  commission: number;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  currency?: string;
  emptyMessage?: string;
}

export default function TransactionHistory({ 
  transactions, 
  currency = 'ARS',
  emptyMessage = 'No hay transacciones registradas'
}: TransactionHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentMethodLabel = (method: Transaction['paymentMethod']) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'MERCADOPAGO':
        return 'Mercado Pago';
      case 'DIGITAL':
        return 'Digital';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: Transaction['paymentMethod']) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-4 w-4" />;
      case 'MERCADOPAGO':
      case 'DIGITAL':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodColor = (method: Transaction['paymentMethod']) => {
    switch (method) {
      case 'CASH':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'MERCADOPAGO':
      case 'DIGITAL':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (transactions.length === 0) {
    return (
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            <Receipt className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Historial de Transacciones</p>
            <p className="text-xs text-slate-500">Tus movimientos financieros</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">
            <Receipt className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
          <Receipt className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Historial de Transacciones</p>
          <p className="text-xs text-slate-500">{transactions.length} movimientos</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id}
            className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-medium text-slate-500">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  {transaction.serviceName}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold border ${getPaymentMethodColor(transaction.paymentMethod)}`}>
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                    {getPaymentMethodLabel(transaction.paymentMethod)}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(transaction.amount)}
                </p>
                {transaction.commission > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>-{formatCurrency(transaction.commission)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Commission Detail */}
            {transaction.commission > 0 && (
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Comisión aplicada:</span> {formatCurrency(transaction.commission)}
                  {transaction.paymentMethod === 'CASH' && (
                    <span className="text-amber-600 font-medium"> • Pago en efectivo</span>
                  )}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

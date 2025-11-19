import React from "react";
import { differenceInDays } from "date-fns";

export default function InvoiceStats({ invoices, onFilterChange }) {
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
  
  const calculateRemaining = (inv) => (inv.total_amount || 0) - (inv.paid_amount || 0);
  
  const allDueTotal = unpaidInvoices.reduce((sum, inv) => sum + calculateRemaining(inv), 0);
  const allDueCount = unpaidInvoices.length;

  const under30 = unpaidInvoices.filter(inv => {
    if (!inv.due_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.due_date));
    return days < 0 || days <= 30;
  });

  const days30to60 = unpaidInvoices.filter(inv => {
    if (!inv.due_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.due_date));
    return days > 30 && days <= 60;
  });

  const days60to90 = unpaidInvoices.filter(inv => {
    if (!inv.due_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.due_date));
    return days > 60 && days <= 90;
  });

  const over90 = unpaidInvoices.filter(inv => {
    if (!inv.due_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.due_date));
    return days > 90;
  });

  const stats = [
    { 
      title: 'invoices due', 
      amount: allDueTotal, 
      count: allDueCount,
      borderColor: 'border-l-slate-400',
      filter: 'unpaid'
    },
    { 
      title: 'under 30 days', 
      amount: under30.reduce((sum, inv) => sum + calculateRemaining(inv), 0), 
      count: under30.length,
      borderColor: 'border-l-yellow-400',
      filter: 'under30'
    },
    { 
      title: '30-60 days', 
      amount: days30to60.reduce((sum, inv) => sum + calculateRemaining(inv), 0), 
      count: days30to60.length,
      borderColor: 'border-l-orange-400',
      filter: '30-60'
    },
    { 
      title: '60-90 days', 
      amount: days60to90.reduce((sum, inv) => sum + calculateRemaining(inv), 0), 
      count: days60to90.length,
      borderColor: 'border-l-red-400',
      filter: '60-90'
    },
    { 
      title: 'over 90 days', 
      amount: over90.reduce((sum, inv) => sum + calculateRemaining(inv), 0), 
      count: over90.length,
      borderColor: 'border-l-red-600',
      filter: 'over90'
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-0 bg-white border border-slate-200 rounded-lg overflow-hidden">
      {stats.map((stat, index) => (
        <div
          key={stat.filter}
          className={`p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors border-l-4 ${stat.borderColor} ${index < stats.length - 1 ? 'border-r border-slate-200' : ''}`}
          onClick={() => onFilterChange(stat.filter)}
        >
          <div className="text-3xl font-bold text-slate-900 mb-1">
            ${stat.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-slate-500">
            {stat.count} {stat.title}
          </div>
        </div>
      ))}
    </div>
  );
}
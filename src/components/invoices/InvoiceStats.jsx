import React from "react";
import { differenceInDays } from "date-fns";

export default function InvoiceStats({ invoices, onFilterChange }) {
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
  
  const totalDue = unpaidInvoices.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0);
  const dueCount = unpaidInvoices.length;
  
  const under30 = unpaidInvoices.filter(inv => {
    if (!inv.issue_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.issue_date));
    return days < 30;
  });
  
  const days30to60 = unpaidInvoices.filter(inv => {
    if (!inv.issue_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.issue_date));
    return days >= 30 && days < 60;
  });
  
  const days60to90 = unpaidInvoices.filter(inv => {
    if (!inv.issue_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.issue_date));
    return days >= 60 && days < 90;
  });
  
  const over90 = unpaidInvoices.filter(inv => {
    if (!inv.issue_date) return false;
    const days = differenceInDays(new Date(), new Date(inv.issue_date));
    return days >= 90;
  });

  const stats = [
    { 
      amount: totalDue, 
      label: `${dueCount} factures dues`, 
      borderColor: 'border-l-4 border-slate-400',
      onClick: () => onFilterChange('sent')
    },
    { 
      amount: under30.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0), 
      label: `moins de 30 jours (${under30.length})`, 
      borderColor: 'border-l-4 border-yellow-400',
      onClick: () => onFilterChange('sent')
    },
    { 
      amount: days30to60.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0), 
      label: `30-60 jours (${days30to60.length})`, 
      borderColor: 'border-l-4 border-orange-400',
      onClick: () => onFilterChange('sent')
    },
    { 
      amount: days60to90.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0), 
      label: `60-90 jours (${days60to90.length})`, 
      borderColor: 'border-l-4 border-orange-500',
      onClick: () => onFilterChange('overdue')
    },
    { 
      amount: over90.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0), 
      label: `plus de 90 jours (${over90.length})`, 
      borderColor: 'border-l-4 border-red-500',
      onClick: () => onFilterChange('overdue')
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-white ${stat.borderColor} p-6 rounded-lg cursor-pointer hover:shadow-lg transition-all`}
          onClick={stat.onClick}
        >
          <div className="text-3xl font-bold text-slate-900 mb-1">
            ${stat.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-slate-500">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
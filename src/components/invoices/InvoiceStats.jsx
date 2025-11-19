import React from "react";
import { Card } from "@/components/ui/card";
import { differenceInDays } from "date-fns";

export default function InvoiceStats({ invoices, onFilterChange }) {
  const calculateAgingData = () => {
    const today = new Date();
    const aging = {
      total: { count: 0, amount: 0 },
      under30: { count: 0, amount: 0 },
      days30_60: { count: 0, amount: 0 },
      days60_90: { count: 0, amount: 0 },
      over90: { count: 0, amount: 0 }
    };

    invoices.forEach(inv => {
      if (inv.status !== 'paid' && inv.due_date) {
        const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
        if (remaining > 0) {
          const daysLate = differenceInDays(today, new Date(inv.due_date));
          
          aging.total.count++;
          aging.total.amount += remaining;

          if (daysLate < 30) {
            aging.under30.count++;
            aging.under30.amount += remaining;
          } else if (daysLate < 60) {
            aging.days30_60.count++;
            aging.days30_60.amount += remaining;
          } else if (daysLate < 90) {
            aging.days60_90.count++;
            aging.days60_90.amount += remaining;
          } else {
            aging.over90.count++;
            aging.over90.amount += remaining;
          }
        }
      }
    });

    return aging;
  };

  const aging = calculateAgingData();

  const stats = [
    { title: 'invoices due', count: aging.total.count, total: aging.total.amount, borderColor: 'border-slate-400' },
    { title: 'under 30 days', count: aging.under30.count, total: aging.under30.amount, borderColor: 'border-yellow-400' },
    { title: '30-60 days', count: aging.days30_60.count, total: aging.days30_60.amount, borderColor: 'border-orange-400' },
    { title: '60-90 days', count: aging.days60_90.count, total: aging.days60_90.amount, borderColor: 'border-red-400' },
    { title: 'over 90 days', count: aging.over90.count, total: aging.over90.amount, borderColor: 'border-red-600' },
  ];

  return (
    <Card className="bg-white shadow-sm border-0">
      <div className="flex items-stretch divide-x divide-slate-200">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`flex-1 p-6 border-l-4 ${stat.borderColor} hover:bg-slate-50 transition-colors cursor-pointer`}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 mb-1">
                ${stat.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-500">
                {stat.count} {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
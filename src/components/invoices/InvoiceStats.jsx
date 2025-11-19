import React from "react";
import { Card } from "@/components/ui/card";
import { FileText, Send, CheckCircle, AlertTriangle } from "lucide-react";

export default function InvoiceStats({ invoices, onFilterChange }) {
  const draftCount = invoices.filter(inv => inv.status === 'draft').length;
  const sentCount = invoices.filter(inv => inv.status === 'sent').length;
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  const draftTotal = invoices.filter(inv => inv.status === 'draft').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const sentTotal = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidTotal = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const overdueTotal = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const stats = [
    { title: 'Brouillon', count: draftCount, total: draftTotal, icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-50', status: 'draft' },
    { title: 'Envoyées', count: sentCount, total: sentTotal, icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-50', status: 'sent' },
    { title: 'Payées', count: paidCount, total: paidTotal, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', status: 'paid' },
    { title: 'En Retard', count: overdueCount, total: overdueTotal, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50', status: 'overdue' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.status}
          className={`p-6 cursor-pointer hover:shadow-lg transition-all ${stat.bgColor}`}
          onClick={() => onFilterChange(stat.status)}
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <span className="text-2xl font-bold text-slate-900">{stat.count}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">{stat.title}</h3>
          <p className={`text-xl font-bold ${stat.color}`}>
            ${stat.total.toFixed(2)}
          </p>
        </Card>
      ))}
    </div>
  );
}
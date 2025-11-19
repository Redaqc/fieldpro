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
    <Card className="p-4">
      <div className="flex items-center justify-between gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.status}
            className={`flex items-center gap-4 flex-1 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all ${stat.bgColor}`}
            onClick={() => onFilterChange(stat.status)}
          >
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{stat.title}</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl font-bold text-slate-900">{stat.count}</span>
                <span className={`text-lg font-semibold ${stat.color}`}>
                  ${stat.total.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
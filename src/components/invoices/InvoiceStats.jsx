import React from "react";
import { Card } from "@/components/ui/card";
import { FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function InvoiceStats({ invoices, onFilterChange }) {
  const draftCount = invoices.filter(inv => inv.status === 'draft').length;
  const draftTotal = invoices.filter(inv => inv.status === 'draft').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const sentCount = invoices.filter(inv => inv.status === 'sent').length;
  const sentTotal = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const overdueTotal = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const paidTotal = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const stats = [
    {
      label: "À facturer",
      count: draftCount,
      total: draftTotal,
      icon: FileText,
      color: "bg-gray-50 hover:bg-gray-100 border-gray-200",
      textColor: "text-gray-900",
      filter: "draft"
    },
    {
      label: "En attente",
      count: sentCount,
      total: sentTotal,
      icon: Clock,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      textColor: "text-blue-900",
      filter: "sent"
    },
    {
      label: "En retard",
      count: overdueCount,
      total: overdueTotal,
      icon: AlertCircle,
      color: "bg-red-50 hover:bg-red-100 border-red-200",
      textColor: "text-red-900",
      filter: "overdue"
    },
    {
      label: "Payées",
      count: paidCount,
      total: paidTotal,
      icon: CheckCircle,
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      textColor: "text-green-900",
      filter: "paid"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`p-6 cursor-pointer transition-all ${stat.color}`}
          onClick={() => onFilterChange(stat.filter)}
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className={`w-8 h-8 ${stat.textColor}`} />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">{stat.label}</h3>
          <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.count}</p>
          <p className="text-sm text-slate-500 mt-1">
            ${stat.total.toFixed(2)}
          </p>
        </Card>
      ))}
    </div>
  );
}
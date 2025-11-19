import React from "react";
import { Card } from "@/components/ui/card";
import { FileText, Send, TrendingUp, TrendingDown } from "lucide-react";

export default function QuotationStats({ quotations, onFilterChange }) {
  const stats = {
    preparation: quotations.filter(q => q.status === 'draft').length,
    sent: quotations.filter(q => q.status === 'sent').length,
    won: quotations.filter(q => q.status === 'accepted').length,
    lost: quotations.filter(q => q.status === 'declined' || q.status === 'expired').length,
  };

  const totalValue = {
    preparation: quotations.filter(q => q.status === 'draft').reduce((sum, q) => sum + (q.total_amount || 0), 0),
    sent: quotations.filter(q => q.status === 'sent').reduce((sum, q) => sum + (q.total_amount || 0), 0),
    won: quotations.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total_amount || 0), 0),
    lost: quotations.filter(q => q.status === 'declined' || q.status === 'expired').reduce((sum, q) => sum + (q.total_amount || 0), 0),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4 bg-white border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => onFilterChange('draft')}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-600">Préparation</h3>
          <FileText className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-slate-900">{stats.preparation}</p>
        <p className="text-sm text-slate-500 mt-1">${totalValue.preparation.toFixed(0)}</p>
        <p className="text-xs text-slate-400">{stats.preparation} soumissions</p>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => onFilterChange('sent')}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-600">Envoyées</h3>
          <Send className="w-5 h-5 text-orange-500" />
        </div>
        <p className="text-3xl font-bold text-slate-900">{stats.sent}</p>
        <p className="text-sm text-slate-500 mt-1">${totalValue.sent.toFixed(0)}</p>
        <p className="text-xs text-slate-400">{stats.sent} soumissions</p>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => onFilterChange('accepted')}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-600">Gagnées</h3>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-3xl font-bold text-slate-900">{stats.won}</p>
        <p className="text-sm text-slate-500 mt-1">${totalValue.won.toFixed(0)}</p>
        <p className="text-xs text-slate-400">{stats.won} soumissions</p>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => onFilterChange('declined')}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-600">Perdues</h3>
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-3xl font-bold text-slate-900">{stats.lost}</p>
        <p className="text-sm text-slate-500 mt-1">${totalValue.lost.toFixed(0)}</p>
        <p className="text-xs text-slate-400">{stats.lost} soumissions</p>
      </Card>
    </div>
  );
}
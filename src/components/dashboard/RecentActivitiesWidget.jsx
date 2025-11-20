import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, DollarSign, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function RecentActivitiesWidget({ invoices, quotations, expenses = [] }) {
  const activities = [
    ...invoices.slice(0, 3).map(inv => ({
      type: 'invoice',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      title: `Facture ${inv.invoice_number}`,
      subtitle: inv.customer_name,
      amount: `$${inv.total?.toFixed(2) || 0}`,
      date: inv.created_date
    })),
    ...quotations.slice(0, 3).map(quote => ({
      type: 'quotation',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      title: `Soumission ${quote.quote_number}`,
      subtitle: quote.customer_name,
      amount: `$${quote.total?.toFixed(2) || 0}`,
      date: quote.created_date
    })),
    ...expenses.slice(0, 3).map(exp => ({
      type: 'expense',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      title: exp.description || 'Dépense',
      subtitle: exp.category || 'Général',
      amount: `-$${exp.amount?.toFixed(2) || 0}`,
      date: exp.created_date
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Activités Récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${activity.bgColor}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.bgColor}`}>
                  <Icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900">{activity.title}</p>
                  <p className="text-xs text-slate-600">{activity.subtitle}</p>
                  <p className="text-xs text-slate-500">{format(new Date(activity.date), 'dd MMM, HH:mm')}</p>
                </div>
                <Badge className="font-semibold">{activity.amount}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
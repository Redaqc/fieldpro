import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, FileText, AlertCircle, TrendingDown, Users, DollarSign } from "lucide-react";

export default function TodaySummaryWidget({ invoices = [], payments = [], jobs = [], expenses = [] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Ventes du mois (factures payées)
  const monthlySales = invoices
    .filter(inv => {
      const invDate = new Date(inv.invoice_date || inv.created_date);
      return invDate.getMonth() === currentMonth && 
             invDate.getFullYear() === currentYear &&
             inv.status === 'paid';
    })
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Factures dues (envoyées mais non payées)
  const invoicesDue = invoices
    .filter(inv => inv.status === 'sent' && (!inv.due_date || new Date(inv.due_date) >= new Date()))
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Factures en retard
  const invoicesOverdue = invoices
    .filter(inv => inv.status === 'overdue' || (inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date()))
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Dépenses du mois
  const monthlyExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.date || exp.created_date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Coûts tech du mois (temps * taux horaire)
  const techCosts = jobs
    .filter(job => {
      const jobDate = new Date(job.created_date);
      return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
    })
    .reduce((sum, job) => {
      const totalLabor = job.costs?.total_labor || 0;
      return sum + totalLabor;
    }, 0);

  // Paiements reçus du mois
  const paymentsReceived = payments
    .filter(pay => {
      const payDate = new Date(pay.payment_date);
      return payDate.getMonth() === currentMonth && 
             payDate.getFullYear() === currentYear &&
             pay.status === 'completed';
    })
    .reduce((sum, pay) => sum + (pay.amount || 0), 0);

  const cards = [
    { 
      title: "Ventes du Mois", 
      amount: monthlySales, 
      gradient: "from-blue-400 to-blue-600",
      icon: TrendingUp 
    },
    { 
      title: "Factures Dues", 
      amount: invoicesDue, 
      gradient: "from-cyan-400 to-cyan-600",
      icon: FileText 
    },
    { 
      title: "Factures Overdue", 
      amount: invoicesOverdue, 
      gradient: "from-purple-400 to-purple-600",
      icon: AlertCircle 
    },
    { 
      title: "Paiements Reçus", 
      amount: paymentsReceived, 
      gradient: "from-slate-400 to-slate-600",
      icon: DollarSign 
    },
    { 
      title: "Dépenses", 
      amount: monthlyExpenses, 
      gradient: "from-green-400 to-green-600",
      icon: TrendingDown 
    },
    { 
      title: "Coûts Tech", 
      amount: techCosts, 
      gradient: "from-violet-400 to-violet-600",
      icon: Users 
    },
  ];

  return (
    <Card className="col-span-full shadow-sm bg-white">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">Today Summary</CardTitle>
          <Select defaultValue="today">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white shadow-lg flex flex-col justify-between min-h-[140px]`}
              >
                <div className="flex items-center justify-between mb-8">
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <Icon className="w-6 h-6 opacity-80" />
                </div>
                <div>
                  <p className="text-3xl font-bold mb-6">${card.amount.toFixed(2)}</p>
                  <button className="text-xs flex items-center gap-1 hover:underline opacity-90 hover:opacity-100 transition-opacity">
                    More info <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
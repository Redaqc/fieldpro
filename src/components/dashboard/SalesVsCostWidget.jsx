import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths } from "date-fns";

export default function SalesVsCostWidget({ invoices, jobs }) {
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return format(date, 'MMM yyyy');
  });

  const chartData = last6Months.map(month => {
    const monthInvoices = invoices.filter(inv => 
      format(new Date(inv.created_date), 'MMM yyyy') === month && 
      inv.status === 'paid'
    );
    
    const monthJobs = jobs.filter(j => 
      j.completed_at && 
      format(new Date(j.completed_at), 'MMM yyyy') === month
    );

    const sales = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const costs = monthJobs.reduce((sum, j) => sum + (j.costs?.total_cost || 0), 0);
    
    return {
      month,
      ventes: sales,
      coûts: costs,
      profit: sales - costs
    };
  });

  const totalSales = chartData.reduce((sum, d) => sum + d.ventes, 0);
  const totalCosts = chartData.reduce((sum, d) => sum + d.coûts, 0);
  const totalProfit = totalSales - totalCosts;
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Ventes vs Coûts
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-slate-600">Marge</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-xs text-green-700 mb-1">Ventes</p>
            <p className="text-xl font-bold text-green-900">${totalSales.toFixed(0)}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <p className="text-xs text-red-700 mb-1">Coûts</p>
            <p className="text-xl font-bold text-red-900">${totalCosts.toFixed(0)}</p>
          </div>
          <div className={`${totalProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'} p-3 rounded-lg text-center`}>
            <p className={`text-xs ${totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'} mb-1`}>Profit</p>
            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
              ${Math.abs(totalProfit).toFixed(0)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ventes" stroke="#10b981" strokeWidth={2} name="Ventes" />
            <Line type="monotone" dataKey="coûts" stroke="#ef4444" strokeWidth={2} name="Coûts" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
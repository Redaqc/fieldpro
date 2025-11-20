import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">
            Sales vs Purchases (2022)
          </CardTitle>
          <button className="text-blue-500 text-sm">ⓘ</button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }} 
              iconType="square"
            />
            <Bar dataKey="ventes" fill="#5b68f4" name="Purchases" radius={[4, 4, 0, 0]} />
            <Bar dataKey="coûts" fill="#4ade80" name="Sales" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
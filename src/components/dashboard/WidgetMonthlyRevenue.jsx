import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export default function WidgetMonthlyRevenue({ invoices = [] }) {
  const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));

  const data = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthRevenue = invoices
      .filter(inv => {
        const invDate = new Date(inv.issue_date);
        return invDate >= monthStart && invDate < startOfMonth(subMonths(monthStart, -1)) && inv.status === 'paid';
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      name: format(month, 'MMM', { locale: fr }),
      revenue: monthRevenue,
    };
  });

  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenus Mensuels</CardTitle>
        <p className="text-2xl font-bold text-green-600">${total.toFixed(2)}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function RevenueChart({ invoices }) {
  // Generate last 6 months data
  const chartData = React.useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthRevenue = invoices
        .filter(inv => {
          if (!inv.issue_date || inv.status !== 'paid') return false;
          const invDate = new Date(inv.issue_date);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      months.push({
        month: format(date, 'MMM'),
        revenue: Math.round(monthRevenue)
      });
    }
    return months;
  }, [invoices]);

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
              formatter={(value) => [`$${value}`, 'Revenue']}
            />
            <Bar 
              dataKey="revenue" 
              fill="#3b82f6" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
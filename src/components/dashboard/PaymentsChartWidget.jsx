import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths } from "date-fns";

export default function PaymentsChartWidget({ payments }) {
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return format(date, 'MMM yyyy');
  });

  const chartData = last6Months.map(month => {
    const monthPayments = payments.filter(p => 
      format(new Date(p.payment_date || p.created_date), 'MMM yyyy') === month && 
      p.status === 'completed'
    );
    
    return {
      month,
      montant: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      nombre: monthPayments.length
    };
  });

  const totalReceived = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Paiements Reçus
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-slate-600">Total Reçu</p>
            <p className="text-2xl font-bold text-green-600">${totalReceived.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="montant" fill="#10b981" name="Montant ($)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
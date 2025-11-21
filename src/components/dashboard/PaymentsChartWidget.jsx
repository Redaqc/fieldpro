import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths } from "date-fns";
import { useTranslation } from "@/components/shared/translations";

export default function PaymentsChartWidget({ payments, lang = 'fr' }) {
  const t = useTranslation(lang);
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
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">
            {t('paymentsChart')}
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
              iconType="circle"
            />
            <Bar dataKey="montant" fill="#10b981" name={t('paymentsReceived')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";

export default function InvoiceRevenueChart({ open, onClose, invoices }) {
  const monthlyRevenue = invoices
    .filter(inv => inv.status === 'paid' && inv.payment_received_date)
    .reduce((acc, inv) => {
      const month = format(startOfMonth(parseISO(inv.payment_received_date)), 'MMM yyyy');
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += inv.total_amount || 0;
      return acc;
    }, {});

  const chartData = Object.entries(monthlyRevenue)
    .map(([month, revenue]) => ({
      month,
      revenue
    }))
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-12);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Revenus par Mois</DialogTitle>
        </DialogHeader>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                labelStyle={{ color: '#333' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
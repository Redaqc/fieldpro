import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

export default function TopClientsWidget({ customers, invoices }) {
  const customerRevenue = customers.map(customer => {
    const customerInvoices = invoices.filter(inv => 
      inv.customer_id === customer.id && 
      inv.status === 'paid'
    );
    const totalRevenue = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    return {
      ...customer,
      revenue: totalRevenue,
      invoiceCount: customerInvoices.length
    };
  }).filter(c => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const colors = ['from-yellow-400 to-orange-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-amber-700', 'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600'];

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Top 5 Clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {customerRevenue.map((customer, idx) => (
          <div 
            key={customer.id} 
            className={`p-4 rounded-lg bg-gradient-to-r ${colors[idx]} text-white shadow-lg`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {customer.logo_url ? (
                  <img src={customer.logo_url} alt={customer.company_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{idx + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{customer.company_name || `${customer.first_name} ${customer.last_name}`}</p>
                <p className="text-sm opacity-90">{customer.invoiceCount} factures</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${customer.revenue.toFixed(0)}</p>
                <div className="flex items-center gap-1 text-xs opacity-90">
                  <TrendingUp className="w-3 h-3" />
                  <span>#{idx + 1}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {customerRevenue.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Aucun client avec revenus</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
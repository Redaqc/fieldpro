import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";

export default function WidgetCustomerStats({ customers = [], jobs = [], invoices = [] }) {
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  
  const customerRevenue = customers.map(customer => {
    const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id && inv.status === 'paid');
    const revenue = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    return { customer, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statistiques Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{activeCustomers}</p>
              <p className="text-xs text-slate-500">Clients actifs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{vipCustomers}</p>
              <p className="text-xs text-slate-500">Clients VIP</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Top 5 Clients (Revenus)</p>
          <div className="space-y-2">
            {customerRevenue.map(({ customer, revenue }) => (
              <div key={customer.id} className="flex justify-between text-sm">
                <span>{customer.first_name} {customer.last_name}</span>
                <span className="font-semibold text-green-600">${revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
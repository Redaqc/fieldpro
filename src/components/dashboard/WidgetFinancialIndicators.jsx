import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingDown, FileText, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function WidgetFinancialIndicators({ jobs, invoices }) {
  // Calculer les factures en attente
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft');
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status !== 'sent') return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date();
  });
  
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  
  // Calculer les coûts totaux des jobs actifs
  const activeJobs = jobs.filter(j => j.status === 'in_progress' || j.status === 'review');
  const totalCosts = activeJobs.reduce((sum, job) => {
    const jobCost = job.costs?.total_cost || 0;
    return sum + jobCost;
  }, 0);
  
  // Calculer revenus potentiels (factures à venir des jobs actifs)
  const potentialRevenue = activeJobs.reduce((sum, job) => {
    return sum + (job.invoice_total || 0);
  }, 0);

  const chartData = [
    {
      name: 'Factures',
      'En attente': totalPending,
      'En retard': totalOverdue,
    },
    {
      name: 'Jobs actifs',
      'Revenus potentiels': potentialRevenue,
      'Coûts engagés': totalCosts,
    }
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow col-span-1 md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-green-500" />
          Indicateurs Financiers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-600">Factures en attente</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">${totalPending.toFixed(0)}</p>
            <p className="text-xs text-blue-500">{pendingInvoices.length} facture(s)</p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-xs font-medium text-red-600">En retard</p>
            </div>
            <p className="text-2xl font-bold text-red-700">${totalOverdue.toFixed(0)}</p>
            <p className="text-xs text-red-500">{overdueInvoices.length} facture(s)</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-600">Revenus potentiels</p>
            </div>
            <p className="text-2xl font-bold text-green-700">${potentialRevenue.toFixed(0)}</p>
            <p className="text-xs text-green-500">{activeJobs.length} job(s)</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-600">Coûts engagés</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">${totalCosts.toFixed(0)}</p>
            <p className="text-xs text-orange-500">Jobs actifs</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="En attente" fill="#3b82f6" />
            <Bar dataKey="En retard" fill="#ef4444" />
            <Bar dataKey="Revenus potentiels" fill="#10b981" />
            <Bar dataKey="Coûts engagés" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
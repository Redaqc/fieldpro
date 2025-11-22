import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

export default function InvoiceChart({ open, onClose, invoices }) {
  // Group invoices by month
  const monthlyData = {};
  
  invoices.forEach(invoice => {
    if (invoice.issue_date) {
      const month = format(new Date(invoice.issue_date), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, total: 0, paid: 0, pending: 0 };
      }
      monthlyData[month].total += invoice.total_amount || 0;
      if (invoice.status === 'paid') {
        monthlyData[month].paid += invoice.total_amount || 0;
      } else {
        monthlyData[month].pending += invoice.total_amount || 0;
      }
    }
  });

  const chartData = Object.values(monthlyData).slice(-12); // Last 12 months

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Facturation Mensuelle</DialogTitle>
        </DialogHeader>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Payé" />
              <Bar dataKey="pending" fill="#3b82f6" name="En attente" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4 bg-slate-50 rounded">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-900">
              ${chartData.reduce((sum, d) => sum + d.total, 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-sm text-green-600">Payé</p>
            <p className="text-2xl font-bold text-green-600">
              ${chartData.reduce((sum, d) => sum + d.paid, 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-600">En Attente</p>
            <p className="text-2xl font-bold text-blue-600">
              ${chartData.reduce((sum, d) => sum + d.pending, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
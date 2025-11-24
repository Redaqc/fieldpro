import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/shared/translations";

export default function InvoicesDueWidget({ invoices, lang = 'fr' }) {
  const t = useTranslation(lang);
  const dueInvoices = invoices.filter(inv => 
    inv.status === 'sent' && 
    inv.due_date && 
    new Date(inv.due_date) >= new Date()
  );

  const pastDueInvoices = invoices.filter(inv => 
    inv.status === 'sent' && 
    inv.due_date && 
    new Date(inv.due_date) < new Date()
  );

  const totalDue = dueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPastDue = pastDueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800">
          {lang === 'fr' ? 'Factures à Recevoir' : 'Invoices Receivable'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-700 mb-1">{t('dueAmount')}</p>
            <p className="text-2xl font-bold text-orange-900">{dueInvoices.length}</p>
            <p className="text-sm text-orange-600 font-semibold">${totalDue.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{t('pastDue')}</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{pastDueInvoices.length}</p>
            <p className="text-sm text-red-600 font-semibold">${totalPastDue.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {pastDueInvoices.slice(0, 5).map(inv => (
            <div key={inv.id} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded">
              <div>
                <p className="font-medium text-red-900">{inv.customer_name}</p>
                <p className="text-xs text-red-600">{format(new Date(inv.due_date), 'dd/MM/yyyy')}</p>
              </div>
              <Badge className="bg-red-600">${inv.total?.toFixed(2)}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { INVOICE_STATUS } from "@/constants/statuses";

export default function WidgetInvoiceSummary({ invoices = [] }) {
  const draft = invoices.filter(inv => inv.status === INVOICE_STATUS.DRAFT).length;
  const sent = invoices.filter(inv => inv.status === INVOICE_STATUS.SENT).length;
  const paid = invoices.filter(inv => inv.status === INVOICE_STATUS.PAID).length;
  const overdue = invoices.filter(inv => inv.status === INVOICE_STATUS.OVERDUE).length;

  const totalPaid = invoices
    .filter(inv => inv.status === INVOICE_STATUS.PAID)
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const totalPending = invoices
    .filter(inv => inv.status === INVOICE_STATUS.SENT || inv.status === INVOICE_STATUS.OVERDUE)
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Résumé Facturation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(0)}</p>
            <p className="text-xs text-slate-600">{paid} payées</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">${totalPending.toFixed(0)}</p>
            <p className="text-xs text-slate-600">{sent + overdue} en attente</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <span className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Brouillons
            </span>
            <span className="font-semibold">{draft}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <span className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Envoyées
            </span>
            <span className="font-semibold">{sent}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-red-50 rounded">
            <span className="text-sm flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              En retard
            </span>
            <span className="font-semibold text-red-600">{overdue}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
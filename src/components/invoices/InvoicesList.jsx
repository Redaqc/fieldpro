import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, DollarSign, Bell } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-800"
};

export default function InvoicesList({ invoices, isLoading, onInvoiceClick }) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No invoices found</h3>
        <p className="text-slate-500">Create your first invoice to get started</p>
      </Card>
    );
  }

  const calculateInvoiceAge = (invoice) => {
    if (!invoice.issue_date) return null;
    const today = new Date();
    const issueDate = new Date(invoice.issue_date);
    return differenceInDays(today, issueDate);
  };

  const calculateDaysRemaining = (invoice) => {
    if (!invoice.due_date) return null;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    return differenceInDays(dueDate, today);
  };

  const calculateOverdueDays = (invoice) => {
    if (invoice.status !== 'overdue' || !invoice.due_date) return null;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    return Math.max(0, differenceInDays(today, dueDate));
  };

  const calculatePaymentDays = (invoice) => {
    if (invoice.status !== 'paid' || !invoice.issue_date || !invoice.payment_received_date) return null;
    const issueDate = new Date(invoice.issue_date);
    const paymentDate = new Date(invoice.payment_received_date);
    return differenceInDays(paymentDate, issueDate);
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-center">Âge</TableHead>
            <TableHead className="text-center">Reste (30j)</TableHead>
            <TableHead className="text-center">Rappel</TableHead>
            <TableHead className="text-center">Retard (jrs)</TableHead>
            <TableHead className="text-right">Payé</TableHead>
            <TableHead className="text-right">Reste à Payer</TableHead>
            <TableHead className="text-center">Jours Paiement</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const age = calculateInvoiceAge(invoice);
            const daysRemaining = calculateDaysRemaining(invoice);
            const overdueDays = calculateOverdueDays(invoice);
            const paymentDays = calculatePaymentDays(invoice);
            const remainingAmount = (invoice.total_amount || 0) - (invoice.paid_amount || 0);

            return (
              <TableRow
                key={invoice.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onInvoiceClick(invoice)}
              >
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.project_name || '-'}</TableCell>
                <TableCell className="text-right font-semibold">
                  ${(invoice.total_amount || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">{age !== null ? `${age}j` : '-'}</TableCell>
                <TableCell className="text-center">
                  {daysRemaining !== null ? (
                    <span className={daysRemaining < 0 ? 'text-red-600 font-semibold' : daysRemaining < 7 ? 'text-orange-600' : ''}>
                      {daysRemaining}j
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {invoice.reminder_sent ? <Bell className="w-4 h-4 text-orange-500 mx-auto" /> : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {overdueDays !== null ? (
                    <span className="text-red-600 font-semibold">{overdueDays}j</span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right text-green-600 font-semibold">
                  {invoice.status === 'paid' ? `$${(invoice.paid_amount || 0).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {invoice.status !== 'paid' && remainingAmount > 0 ? (
                    <span className="text-orange-600 font-semibold">${remainingAmount.toFixed(2)}</span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {paymentDays !== null ? `${paymentDays}j` : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
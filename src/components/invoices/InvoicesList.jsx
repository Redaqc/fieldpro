import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-800"
};

export default function InvoicesList({ invoices, isLoading, onInvoiceClick, onDelete }) {
  const calculateAge = (issueDate) => {
    if (!issueDate) return '-';
    const days = differenceInDays(new Date(), new Date(issueDate));
    return `${days}j`;
  };

  const calculateOverdue = (dueDate, status) => {
    if (!dueDate || status === 'paid') return '-';
    const days = differenceInDays(new Date(), new Date(dueDate));
    return days > 0 ? `${days}j` : '-';
  };

  const calculateRemaining = (total, paid) => {
    const remaining = (total || 0) - (paid || 0);
    return remaining > 0 ? remaining : 0;
  };

  const calculatePaymentDays = (issueDate, paidDate, status) => {
    if (status !== 'paid' || !issueDate) return '-';
    const days = paidDate 
      ? differenceInDays(new Date(paidDate), new Date(issueDate))
      : differenceInDays(new Date(), new Date(issueDate));
    return `${days}j`;
  };

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">Aucune facture trouvée</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Créé</TableHead>
            <TableHead>Jours Retard</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onInvoiceClick(invoice)}
            >
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.project_name || '-'}</TableCell>
              <TableCell>{invoice.customer_name || '-'}</TableCell>
              <TableCell className="text-right font-semibold">
                ${(invoice.total_amount || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-semibold text-orange-600">
                ${calculateRemaining(invoice.total_amount, invoice.paid_amount).toFixed(2)}
              </TableCell>
              <TableCell>
                {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell>
                {invoice.issue_date ? format(new Date(invoice.issue_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell className={calculateOverdue(invoice.due_date, invoice.status) !== '-' ? 'text-red-600 font-semibold' : ''}>
                {calculateOverdue(invoice.due_date, invoice.status)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Supprimer cette facture?')) onDelete(invoice.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
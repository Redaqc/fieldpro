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

  const calculateDaysLate = (dueDate, status) => {
    if (!dueDate || status === 'paid') return '-';
    const days = differenceInDays(new Date(), new Date(dueDate));
    return days > 0 ? days : '-';
  };

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">Aucune facture trouvée</p>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200 bg-slate-50">
            <TableHead className="text-slate-600 font-medium">Invoice No.</TableHead>
            <TableHead className="text-slate-600 font-medium">Invoice Name</TableHead>
            <TableHead className="text-slate-600 font-medium">Client name</TableHead>
            <TableHead className="text-slate-600 font-medium text-right">Total</TableHead>
            <TableHead className="text-slate-600 font-medium text-right">Balance</TableHead>
            <TableHead className="text-slate-600 font-medium">Due on</TableHead>
            <TableHead className="text-slate-600 font-medium">Created</TableHead>
            <TableHead className="text-slate-600 font-medium text-right">Days Late</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const daysLate = calculateDaysLate(invoice.due_date, invoice.status);
            return (
              <TableRow
                key={invoice.id}
                className="cursor-pointer hover:bg-slate-50 border-b border-slate-100"
                onClick={() => onInvoiceClick(invoice)}
              >
                <TableCell className="font-medium text-slate-900">{invoice.invoice_number}</TableCell>
                <TableCell className="text-slate-600">-</TableCell>
                <TableCell className="text-slate-900">{invoice.customer_name || '-'}</TableCell>
                <TableCell className="text-right font-medium text-slate-900">
                  ${(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-medium text-slate-900">
                  ${calculateRemaining(invoice.total_amount, invoice.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-slate-600">
                  {invoice.due_date ? format(new Date(invoice.due_date), 'EEE MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-slate-600">
                  {invoice.issue_date ? format(new Date(invoice.issue_date), 'EEE MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell className={`text-right font-semibold ${daysLate !== '-' ? 'text-red-600' : 'text-slate-400'}`}>
                  {daysLate}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Supprimer cette facture?')) onDelete(invoice.id);
                    }}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
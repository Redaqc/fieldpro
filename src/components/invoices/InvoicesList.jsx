import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

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

  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => (
        <Card
          key={invoice.id}
          className="p-6 hover:shadow-md transition-all cursor-pointer border-slate-200"
          onClick={() => onInvoiceClick(invoice)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-lg text-slate-900">
                  {invoice.invoice_number}
                </h3>
                <Badge className={statusColors[invoice.status]}>
                  {invoice.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Customer:</span>
                  <span>{invoice.customer_name || 'Unknown'}</span>
                </div>
                {invoice.issue_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issued: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {invoice.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(invoice.total_amount || 0).toFixed(2)}
              </p>
              {invoice.paid_amount > 0 && invoice.status !== 'paid' && (
                <p className="text-sm text-green-600 mt-1">
                  ${invoice.paid_amount.toFixed(2)} paid
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
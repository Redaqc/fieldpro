import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, User, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-slate-100 text-slate-800 border-slate-200"
};

export default function InvoicesList({ invoices, isLoading, onSelectInvoice }) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">No invoices found. Create your first invoice!</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => (
        <Card 
          key={invoice.id}
          className="p-6 hover:shadow-md transition-all cursor-pointer border-slate-200"
          onClick={() => onSelectInvoice(invoice)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-semibold text-slate-900">
                  Invoice #{invoice.invoice_number || invoice.id.slice(0, 8)}
                </h3>
                <Badge className={statusColors[invoice.status]}>
                  {invoice.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{invoice.customer_name || 'No customer'}</span>
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

              {invoice.line_items && invoice.line_items.length > 0 && (
                <p className="text-sm text-slate-500">
                  {invoice.line_items.length} item{invoice.line_items.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ${(invoice.total_amount || 0).toFixed(2)}
              </p>
              {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
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
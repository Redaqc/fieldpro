import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800"
};

export default function QuotationsList({ quotations, isLoading, onQuoteClick, onDelete }) {
  if (quotations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No quotations found</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {quotations.map((quote) => (
        <Card key={quote.id} className="p-6 hover:shadow-md transition-all border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 cursor-pointer" onClick={() => onQuoteClick(quote)}>
              <div className="flex items-center gap-3 mb-3">
                <FileCheck className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-lg text-slate-900">
                  {quote.quote_number}
                </h3>
                <Badge className={statusColors[quote.status]}>
                  {quote.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Customer:</span>
                  <span>{quote.customer_name}</span>
                </div>
                {quote.issue_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issued: {format(new Date(quote.issue_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {quote.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Expires: {format(new Date(quote.expiry_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${(quote.total_amount || 0).toFixed(2)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this quotation?')) onDelete(quote.id);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
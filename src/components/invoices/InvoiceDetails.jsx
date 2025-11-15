import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Download, Mail, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-800"
};

export default function InvoiceDetails({ invoice, onClose, onEdit, onUpdate, onDelete }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">
                Invoice {invoice.invoice_number}
              </DialogTitle>
              <Badge className={statusColors[invoice.status]}>
                {invoice.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this invoice?')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Bill To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">{invoice.customer_name}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {invoice.issue_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Issued: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {invoice.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.line_items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unit_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${item.total?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">${invoice.subtotal?.toFixed(2)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax ({invoice.tax_rate}%):</span>
                    <span className="font-semibold">${invoice.tax_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Total:</span>
                  <span>${invoice.total_amount?.toFixed(2)}</span>
                </div>
                {invoice.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>-${invoice.paid_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Balance Due:</span>
                      <span>${(invoice.total_amount - invoice.paid_amount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Email to Customer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
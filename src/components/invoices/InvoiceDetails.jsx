import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [templateName, setTemplateName] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const downloadPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; }
          }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 { 
            color: #1e40af; 
            margin: 0;
            font-size: 32px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0;
          }
          th { 
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #1e40af;
            font-weight: bold;
          }
          td { 
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .total-final {
            font-weight: bold;
            font-size: 20px;
            border-top: 2px solid #1e40af;
            padding-top: 10px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURE</h1>
          <p style="margin: 5px 0; color: #666;">Numéro: ${invoice.invoice_number}</p>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-item">
              <div class="info-label">Client</div>
              <div>${invoice.customer_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Projet</div>
              <div>${invoice.project_name || 'N/A'}</div>
            </div>
          </div>
          <div>
            <div class="info-item">
              <div class="info-label">Date d'émission</div>
              <div>${format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date d'échéance</div>
              <div>${invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : 'N/A'}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.line_items?.map(item => {
              if (item.type === 'title') {
                return `<tr><td colspan="4" style="font-weight: bold; font-size: 16px; padding-top: 20px;">${item.description}</td></tr>`;
              }
              if (item.type === 'description') {
                return `<tr><td colspan="4" style="color: #666; font-style: italic;">${item.description}</td></tr>`;
              }
              return `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${(item.unit_price || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600;">$${(item.total || 0).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Sous-total:</span>
            <span>$${(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>TPS (5%):</span>
            <span>$${(invoice.tax_amount || 0).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>TVQ (9.975%):</span>
            <span>$${(invoice.tax_amount_2 || 0).toFixed(2)}</span>
          </div>
          <div class="totals-row total-final">
            <span>TOTAL:</span>
            <span>$${(invoice.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const addPayment = () => {
    if (!paymentDate || !paymentAmount) {
      alert("Entrez une date et un montant");
      return;
    }
    
    const newPaidAmount = (invoice.paid_amount || 0) + parseFloat(paymentAmount);
    onUpdate({ 
      id: invoice.id, 
      data: { paid_amount: newPaidAmount }
    });
    setPaymentDate("");
    setPaymentAmount("");
  };

  const cancelInvoice = () => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette facture?")) {
      onUpdate({ id: invoice.id, data: { status: "cancelled" }});
    }
  };

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

          {/* Informations additionnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Informations additionnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Sauvegarder un modèle:</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Taper le nom d'un modèle"
                  className="flex-1 h-9"
                />
                <Button size="sm" variant="outline">Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>

          {/* Autres versions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Autres versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                <div className="flex justify-between py-2">
                  <span>Facture {invoice.invoice_number} ({invoice.issue_date ? format(new Date(invoice.issue_date), 'dd MMMM yyyy') : 'N/A'})</span>
                  <a href="#" className="text-blue-600">Voir la facture</a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paiements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Paiements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Montant</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9"
                    step="0.01"
                  />
                </div>
                <Button size="sm" onClick={addPayment}>Ajouter</Button>
              </div>
              
              {invoice.paid_amount > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>{format(new Date(), 'dd MMMM yyyy')}</span>
                    <span className="font-semibold">{invoice.paid_amount.toFixed(2)}$</span>
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Solde dû</span>
                  <span>{((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toFixed(2)}$</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations comptables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Informations comptables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <Label>Item Sage</Label>
                <Input className="h-9 mt-1" placeholder="Champs requis pour les exports comptables" />
              </div>
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-slate-600">
                <div>Facture créée par {invoice.created_by} le {format(new Date(invoice.created_date || new Date()), 'EEEE dd MMMM yyyy HH:mm')}</div>
                {invoice.sent_date && (
                  <div>Facture PDF mise-à-jour par {invoice.created_by} le {format(new Date(invoice.sent_date), 'EEEE dd MMMM yyyy HH:mm')}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={downloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email to Customer
              </Button>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-slate-600">
                Vous pouvez annuler cette facture (ainsi que toutes ses autres révisions) en cliquant ici:
              </p>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={cancelInvoice}
              >
                Annuler facture
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentDialog({ open, onClose, invoice }) {
  const [formData, setFormData] = useState({
    amount: invoice?.total || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  const recordPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      // Create payment record
      await base44.entities.Payment.create({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: data.notes,
        recorded_by: user.email
      });

      // Update invoice status
      await base44.entities.Invoice.update(invoice.id, {
        status: 'paid',
        paid_date: data.payment_date
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Invoice Total:</span>
              <span className="font-semibold">${invoice?.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Customer:</span>
              <span className="font-medium">{invoice?.customer_name}</span>
            </div>
          </div>

          <div>
            <Label>Payment Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Reference Number</Label>
            <Input
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Check #, Transaction ID, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => recordPaymentMutation.mutate(formData)}
              disabled={formData.amount <= 0 || recordPaymentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Record Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
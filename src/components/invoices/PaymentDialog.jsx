import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { PAYMENT_STATUS, INVOICE_STATUS } from "@/constants/statuses";

export default function PaymentDialog({ open, onClose, invoice }) {
  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  /**
   * AUDIT FIX: Critical Issue #5 - Payment Overpayment Validation
   * Fetch existing payments to calculate remaining balance
   */
  const { data: existingPayments = [] } = useQuery({
    queryKey: ['payments', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return [];
      return await base44.entities.Payment.filter({
        invoice_id: invoice.id,
        status: PAYMENT_STATUS.COMPLETED
      });
    },
    enabled: !!invoice?.id && open,
  });

  // Calculate total already paid and remaining balance
  const totalPaid = existingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const invoiceTotal = invoice?.total || 0;
  const remainingBalance = Math.max(0, invoiceTotal - totalPaid);

  // Set default payment amount to remaining balance when dialog opens
  useEffect(() => {
    if (open && remainingBalance > 0) {
      setFormData(prev => ({ ...prev, amount: remainingBalance }));
    }
  }, [open, remainingBalance]);

  const recordPaymentMutation = useMutation({
    mutationFn: async (data) => {
      /**
       * AUDIT FIX: Critical Issue #5 - Payment Overpayment Validation
       * Prevent payments exceeding remaining balance
       */
      // VALIDATION: Check for overpayment
      if (data.amount > remainingBalance) {
        throw new Error(
          `Payment amount ($${data.amount.toFixed(2)}) exceeds remaining balance ($${remainingBalance.toFixed(2)}). Cannot accept overpayment.`
        );
      }

      if (data.amount <= 0) {
        throw new Error('Payment amount must be greater than zero.');
      }

      const user = await base44.auth.me();

      // Create payment record
      const payment = await base44.entities.Payment.create({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: data.notes,
        status: PAYMENT_STATUS.COMPLETED,
        recorded_by: user.email
      });

      // Calculate new total paid (including this payment)
      const newTotalPaid = totalPaid + data.amount;

      // Determine correct invoice status based on total paid
      let newStatus;
      if (newTotalPaid >= invoiceTotal) {
        newStatus = INVOICE_STATUS.PAID;
      } else if (newTotalPaid > 0) {
        newStatus = INVOICE_STATUS.PARTIAL;
      } else {
        newStatus = invoice.status || INVOICE_STATUS.SENT;
      }

      // Update invoice with correct status
      await base44.entities.Invoice.update(invoice.id, {
        status: newStatus,
        paid_date: newStatus === INVOICE_STATUS.PAID ? data.payment_date : invoice.paid_date,
        payment_method: data.payment_method,
        total_paid: newTotalPaid
      });

      // Add audit log
      const existingLog = invoice.activity_log || [];
      await base44.entities.Invoice.update(invoice.id, {
        activity_log: [
          ...existingLog,
          {
            action: 'payment_recorded',
            amount: data.amount,
            method: data.payment_method,
            payment_id: payment.id,
            new_status: newStatus,
            total_paid: newTotalPaid,
            timestamp: new Date().toISOString(),
            user: user.email
          }
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setError(null);
      onClose();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary - Enhanced with remaining balance */}
          <div className="bg-slate-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Customer:</span>
              <span className="font-medium">{invoice?.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Invoice Total:</span>
              <span className="font-semibold">${invoiceTotal.toFixed(2)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Already Paid:</span>
                  <span className="font-semibold text-green-600">-${totalPaid.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2"></div>
              </>
            )}
            <div className="flex justify-between text-base">
              <span className="font-semibold text-slate-900">Remaining Balance:</span>
              <span className="font-bold text-blue-600">${remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Warning if invoice already fully paid */}
          {remainingBalance === 0 && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Invoice Fully Paid:</strong> This invoice has been paid in full. No additional payment is needed.
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <div>
            <Label>Payment Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                setError(null); // Clear error on input change
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
              }}
              className="mt-1"
              max={remainingBalance}
              disabled={remainingBalance === 0}
            />
            {formData.amount > remainingBalance && (
              <p className="text-xs text-red-600 mt-1">
                Amount cannot exceed remaining balance of ${remainingBalance.toFixed(2)}
              </p>
            )}
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
              onClick={() => {
                setError(null);
                recordPaymentMutation.mutate(formData);
              }}
              disabled={
                formData.amount <= 0 ||
                formData.amount > remainingBalance ||
                remainingBalance === 0 ||
                recordPaymentMutation.isPending
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
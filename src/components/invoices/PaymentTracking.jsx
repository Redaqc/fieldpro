import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle } from "lucide-react";

export default function PaymentTracking({ invoice }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash',
    date: new Date().toISOString().split('T')[0]
  });
  const queryClient = useQueryClient();

  const recordPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const totalPaid = (invoice.payments_received || []).reduce((sum, p) => sum + p.amount, 0) + data.amount;
      const newStatus = totalPaid >= invoice.total ? 'paid' : 'partial';

      return base44.entities.Invoice.update(invoice.id, {
        payments_received: [
          ...(invoice.payments_received || []),
          {
            amount: data.amount,
            method: data.method,
            date: data.date,
            recorded_by: (await base44.auth.me()).email,
            recorded_at: new Date().toISOString()
          }
        ],
        status: newStatus,
        paid_date: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_date
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowPaymentForm(false);
      setPaymentData({ amount: 0, method: 'cash', date: new Date().toISOString().split('T')[0] });
    },
  });

  const totalPaid = (invoice.payments_received || []).reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  return (
    <Card className={remaining > 0 ? 'border-orange-200' : 'border-green-200'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Payment Status</span>
          {remaining === 0 ? (
            <Badge className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Paid in Full
            </Badge>
          ) : (
            <Badge className="bg-orange-500">
              ${remaining.toFixed(2)} Due
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Invoice Total:</span>
          <span className="font-semibold">${invoice.total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Paid:</span>
          <span className="font-semibold text-green-600">${totalPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-2">
          <span>Remaining:</span>
          <span className={remaining > 0 ? 'text-orange-600' : 'text-green-600'}>
            ${remaining.toFixed(2)}
          </span>
        </div>

        {/* Payment History */}
        {(invoice.payments_received || []).length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Payment History:</p>
            {invoice.payments_received.map((payment, idx) => (
              <div key={idx} className="flex justify-between text-xs bg-slate-50 p-2 rounded">
                <div>
                  <span className="font-medium">{payment.method}</span>
                  <span className="text-slate-500 ml-2">{payment.date}</span>
                </div>
                <span className="font-semibold">${payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {remaining > 0 && (
          <>
            {showPaymentForm ? (
              <div className="border-t pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Select
                      value={paymentData.method}
                      onValueChange={(v) => setPaymentData({ ...paymentData, method: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="h-9"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => recordPaymentMutation.mutate(paymentData)}
                    disabled={paymentData.amount <= 0 || recordPaymentMutation.isPending}
                    className="flex-1"
                  >
                    Record Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setPaymentData({ ...paymentData, amount: remaining });
                  setShowPaymentForm(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
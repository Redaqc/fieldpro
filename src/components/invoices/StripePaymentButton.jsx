import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Loader2 } from "lucide-react";
import { loadStripe } from 'npm:@stripe/stripe-js@2.4.0';
import { Elements, PaymentElement, useStripe, useElements } from 'npm:@stripe/react-stripe-js@2.4.0';

const stripePromise = loadStripe(window.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ invoice, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment-success',
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${invoice.total?.toFixed(2) || '0.00'}`
        )}
      </Button>
    </form>
  );
}

export default function StripePaymentButton({ invoice }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('stripePayment', {
        invoice_id: invoice.id,
        amount: invoice.total,
        customer_email: invoice.customer_email
      });

      setClientSecret(data.clientSecret);
      setDialogOpen(true);
    } catch (error) {
      alert('Failed to initiate payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    alert('Payment successful!');
    window.location.reload();
  };

  return (
    <>
      <Button
        onClick={initiatePayment}
        disabled={loading || invoice.status === 'paid'}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        Pay with Stripe
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice #{invoice.invoice_number}</DialogTitle>
          </DialogHeader>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm invoice={invoice} onSuccess={handleSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
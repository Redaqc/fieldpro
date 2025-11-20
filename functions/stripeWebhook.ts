import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.12.0';

/**
 * Stripe Webhook Handler
 * Handles payment success and updates invoice status
 */

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      return Response.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Initialize Base44 with service role
    const base44 = createClientFromRequest(req);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { invoice_id } = paymentIntent.metadata;

      // Update invoice status
      const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
      const invoice = invoices[0];

      if (invoice) {
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: 'stripe'
        });

        // Create payment record
        await base44.asServiceRole.entities.Payment.create({
          invoice_id: invoice.id,
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          amount: paymentIntent.amount / 100,
          payment_date: new Date().toISOString(),
          payment_method: 'stripe',
          stripe_payment_intent: paymentIntent.id,
          stripe_charge_id: paymentIntent.charges?.data[0]?.id,
          status: 'completed',
          recorded_by: 'system'
        });
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});
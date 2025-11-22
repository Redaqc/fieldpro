import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.12.0';

/**
 * AUDIT FIX: Critical Issue #3 (Backend)
 * Stripe Webhook Handler - Server-side payment verification
 *
 * Handles Stripe payment events and updates database
 * - Creates Payment records
 * - Updates Invoice status (partial vs paid)
 * - Ensures idempotency
 */

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      console.error('[stripeWebhook] Missing Stripe configuration');
      return Response.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    if (!signature) {
      console.error('[stripeWebhook] Missing stripe-signature header');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature (prevents fake webhooks)
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[stripeWebhook] Signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[stripeWebhook] Received event: ${event.type}`);

    // Initialize Base44 with service role
    const base44 = createClientFromRequest(req);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { invoice_id } = paymentIntent.metadata;

      if (!invoice_id) {
        console.error('[stripeWebhook] Missing invoice_id in metadata');
        return Response.json({ error: 'Missing invoice_id' }, { status: 400 });
      }

      console.log(`[stripeWebhook] Processing payment for invoice ${invoice_id}`);

      // Check for duplicate payment (idempotency)
      const existingPayments = await base44.asServiceRole.entities.Payment.filter({
        stripe_payment_intent: paymentIntent.id
      });

      if (existingPayments && existingPayments.length > 0) {
        console.log(`[stripeWebhook] Payment already recorded for ${paymentIntent.id}`);
        return Response.json({ received: true, duplicate: true });
      }

      // Get invoice
      const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
      const invoice = invoices[0];

      if (!invoice) {
        console.error(`[stripeWebhook] Invoice ${invoice_id} not found`);
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Calculate payment amount (Stripe uses cents)
      const paymentAmount = paymentIntent.amount / 100;

      // Create payment record
      const payment = await base44.asServiceRole.entities.Payment.create({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        amount: paymentAmount,
        payment_date: new Date().toISOString(),
        payment_method: 'stripe',
        stripe_payment_intent: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges?.data[0]?.id,
        status: 'completed',
        recorded_by: 'system'
      });

      console.log(`[stripeWebhook] Created payment record ${payment.id}`);

      // Calculate total paid for this invoice
      const allPayments = await base44.asServiceRole.entities.Payment.filter({
        invoice_id: invoice.id,
        status: 'completed'
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const invoiceTotal = invoice.total || 0;

      // Determine correct invoice status
      let newStatus;
      if (totalPaid >= invoiceTotal) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      } else {
        newStatus = invoice.status || 'sent';
      }

      // Update invoice
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        status: newStatus,
        paid_date: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_date,
        payment_method: 'stripe',
        total_paid: totalPaid
      });

      console.log(`[stripeWebhook] Updated invoice ${invoice.id} status to ${newStatus}`);

      // Add audit log
      try {
        const existingLog = invoice.activity_log || [];
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          activity_log: [
            ...existingLog,
            {
              action: 'payment_received',
              amount: paymentAmount,
              method: 'stripe',
              payment_id: payment.id,
              new_status: newStatus,
              timestamp: new Date().toISOString(),
              user: 'system'
            }
          ]
        });
      } catch (logError) {
        console.error('[stripeWebhook] Failed to log activity:', logError);
        // Don't fail the webhook if logging fails
      }
    }

    return Response.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[stripeWebhook] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
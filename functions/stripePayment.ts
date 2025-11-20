import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.12.0';

/**
 * Create Stripe Payment Intent
 * Requires STRIPE_SECRET_KEY in environment variables
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id, amount, customer_email } = await req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      receipt_email: customer_email,
      metadata: {
        invoice_id,
        app_id: Deno.env.get('BASE44_APP_ID')
      }
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
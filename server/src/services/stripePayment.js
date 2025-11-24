/**
 * Stripe Payment Service
 * Handle Stripe payment processing
 * Replaces Base44 stripePayment function
 */

import Stripe from 'stripe';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { badRequest } from '../middleware/errorHandler.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

/**
 * Create a payment intent
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Payment intent
 */
export async function createPaymentIntent(params) {
  const {
    invoice_id,
    amount,
    currency = 'usd',
    customer_email,
    metadata = {}
  } = params;

  if (!amount || amount <= 0) {
    throw badRequest('Valid amount is required');
  }

  let invoice;
  if (invoice_id) {
    invoice = await Invoice.findById(invoice_id);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata: {
      invoice_id: invoice_id || '',
      invoice_number: invoice?.invoice_number || '',
      ...metadata
    },
    receipt_email: customer_email,
    automatic_payment_methods: {
      enabled: true
    }
  });

  return {
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: paymentIntent.status
  };
}

/**
 * Create a Stripe customer
 * @param {Object} params - Customer parameters
 * @returns {Promise<Object>} Stripe customer
 */
export async function createStripeCustomer(params) {
  const { customer_id, email, name, phone, metadata = {} } = params;

  if (!email) {
    throw badRequest('Email is required');
  }

  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    phone,
    metadata: {
      customer_id: customer_id || '',
      ...metadata
    }
  });

  // Update local customer with Stripe ID
  if (customer_id) {
    await Customer.update(customer_id, {
      metadata: { stripe_customer_id: stripeCustomer.id }
    });
  }

  return {
    stripe_customer_id: stripeCustomer.id,
    email: stripeCustomer.email,
    name: stripeCustomer.name
  };
}

/**
 * Create a checkout session
 * @param {Object} params - Checkout parameters
 * @returns {Promise<Object>} Checkout session
 */
export async function createCheckoutSession(params) {
  const {
    invoice_id,
    success_url,
    cancel_url,
    customer_email,
    mode = 'payment'
  } = params;

  if (!invoice_id) {
    throw badRequest('Invoice ID is required');
  }
  if (!success_url || !cancel_url) {
    throw badRequest('Success and cancel URLs are required');
  }

  const invoice = await Invoice.findById(invoice_id);

  const session = await stripe.checkout.sessions.create({
    mode,
    customer_email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: invoice.notes || 'Field service invoice'
          },
          unit_amount: Math.round(invoice.balance * 100)
        },
        quantity: 1
      }
    ],
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number
    },
    success_url,
    cancel_url
  });

  return {
    session_id: session.id,
    url: session.url,
    payment_status: session.payment_status
  };
}

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe event
 * @returns {Promise<Object>} Result
 */
export async function handleWebhookEvent(event) {
  const { type, data } = event;

  switch (type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = data.object;
      const invoiceId = paymentIntent.metadata.invoice_id;

      if (invoiceId) {
        // Create payment record
        const payment = await Payment.create({
          invoice_id: invoiceId,
          amount: paymentIntent.amount / 100,
          payment_date: new Date(),
          payment_method: 'stripe',
          transaction_id: paymentIntent.id,
          notes: 'Stripe payment'
        });

        return {
          success: true,
          event_type: type,
          payment_id: payment.id
        };
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = data.object;
      console.error('Payment failed:', paymentIntent.last_payment_error);

      return {
        success: false,
        event_type: type,
        error: paymentIntent.last_payment_error?.message
      };
    }

    case 'checkout.session.completed': {
      const session = data.object;
      const invoiceId = session.metadata.invoice_id;

      if (invoiceId && session.payment_status === 'paid') {
        // Create payment record
        const payment = await Payment.create({
          invoice_id: invoiceId,
          amount: session.amount_total / 100,
          payment_date: new Date(),
          payment_method: 'stripe',
          transaction_id: session.payment_intent,
          notes: 'Stripe checkout payment'
        });

        return {
          success: true,
          event_type: type,
          payment_id: payment.id
        };
      }
      break;
    }

    case 'charge.refunded': {
      const charge = data.object;
      console.log('Charge refunded:', charge.id);

      return {
        success: true,
        event_type: type,
        charge_id: charge.id
      };
    }

    default:
      console.log('Unhandled webhook event type:', type);
      return {
        success: true,
        event_type: type,
        message: 'Event received but not processed'
      };
  }

  return {
    success: true,
    event_type: type
  };
}

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Verified event
 */
export function verifyWebhookSignature(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    throw badRequest(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Create a refund
 * @param {Object} params - Refund parameters
 * @returns {Promise<Object>} Refund
 */
export async function createRefund(params) {
  const { payment_intent_id, amount, reason = 'requested_by_customer' } = params;

  if (!payment_intent_id) {
    throw badRequest('Payment intent ID is required');
  }

  const refund = await stripe.refunds.create({
    payment_intent: payment_intent_id,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason
  });

  return {
    refund_id: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
    reason: refund.reason
  };
}

/**
 * Get payment intent status
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment intent
 */
export async function getPaymentIntentStatus(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata
  };
}

export default {
  createPaymentIntent,
  createStripeCustomer,
  createCheckoutSession,
  handleWebhookEvent,
  verifyWebhookSignature,
  createRefund,
  getPaymentIntentStatus
};

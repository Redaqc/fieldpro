/**
 * SMS Notification Service
 * Send SMS using Twilio
 * Replaces Base44 function: sendSMS
 */

import twilio from 'twilio';
import { badRequest } from '../middleware/errorHandler.js';

// Twilio configuration from environment variables
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER
};

// Create Twilio client
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient && twilioConfig.accountSid && twilioConfig.authToken) {
    twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  }
  return twilioClient;
}

/**
 * Send SMS
 * @param {Object} options - SMS options
 * @returns {Promise<Object>} SMS result
 */
export async function sendSMS(options) {
  const {
    to,
    message,
    from = twilioConfig.phoneNumber
  } = options;

  // Validate required fields
  if (!to) {
    throw badRequest('Recipient phone number is required');
  }
  if (!message) {
    throw badRequest('SMS message is required');
  }

  // Check if Twilio is configured
  const client = getTwilioClient();
  if (!client) {
    console.warn('Twilio not configured. SMS not sent.');
    return {
      success: false,
      error: 'Twilio not configured'
    };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from,
      to
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    };
  } catch (error) {
    console.error('SMS send error:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Send job assignment SMS
 */
export async function sendJobAssignmentSMS(job, technician) {
  const message = `New job assigned: ${job.job_number} - ${job.title}. Scheduled: ${new Date(job.scheduled_date).toLocaleString()}. Check the app for details.`;

  return await sendSMS({
    to: technician.phone,
    message
  });
}

/**
 * Send job reminder SMS
 */
export async function sendJobReminderSMS(job, technician) {
  const message = `Reminder: Job ${job.job_number} scheduled for ${new Date(job.scheduled_date).toLocaleString()}. Location: ${job.location_address || 'See app'}.`;

  return await sendSMS({
    to: technician.phone,
    message
  });
}

/**
 * Send invoice reminder SMS
 */
export async function sendInvoiceReminderSMS(invoice, customer) {
  const message = `Invoice ${invoice.invoice_number} of $${invoice.total_amount.toFixed(2)} is due on ${new Date(invoice.due_date).toLocaleDateString()}. Please make payment.`;

  return await sendSMS({
    to: customer.phone,
    message
  });
}

/**
 * Send service call notification SMS
 */
export async function sendServiceCallSMS(serviceCall, customer) {
  const message = `Your service call has been received. We'll get back to you shortly. Reference: ${serviceCall.id}`;

  return await sendSMS({
    to: customer.phone,
    message
  });
}

/**
 * Send verification code SMS
 */
export async function sendVerificationCodeSMS(phone, code) {
  const message = `Your FieldPro verification code is: ${code}. This code will expire in 10 minutes.`;

  return await sendSMS({
    to: phone,
    message
  });
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(recipients, message) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await sendSMS({
        to: recipient.phone,
        message: message.replace(/\{name\}/g, recipient.name)
      });
      results.push({ ...result, recipient: recipient.phone });
    } catch (error) {
      results.push({
        success: false,
        recipient: recipient.phone,
        error: error.message
      });
    }
  }

  return {
    total: recipients.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

export default {
  sendSMS,
  sendJobAssignmentSMS,
  sendJobReminderSMS,
  sendInvoiceReminderSMS,
  sendServiceCallSMS,
  sendVerificationCodeSMS,
  sendBulkSMS
};

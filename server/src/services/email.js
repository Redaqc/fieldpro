/**
 * Email Notification Service
 * Send emails using nodemailer
 * Replaces Base44 function: sendEmail
 */

import nodemailer from 'nodemailer';
import { badRequest } from '../middleware/errorHandler.js';

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter(emailConfig);
  }
  return transporter;
}

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Email result
 */
export async function sendEmail(options) {
  const {
    to,
    subject,
    text,
    html,
    from = process.env.SMTP_FROM || 'noreply@fieldpro.com',
    cc,
    bcc,
    attachments = [],
    replyTo
  } = options;

  // Validate required fields
  if (!to) {
    throw badRequest('Recipient email address is required');
  }
  if (!subject) {
    throw badRequest('Email subject is required');
  }
  if (!text && !html) {
    throw badRequest('Email body (text or html) is required');
  }

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
    cc,
    bcc,
    replyTo,
    attachments
  };

  try {
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send job assignment notification
 */
export async function sendJobAssignmentEmail(job, technician, customer) {
  const subject = `New Job Assignment: ${job.job_number}`;

  const html = `
    <h2>New Job Assignment</h2>
    <p>Hi ${technician.first_name},</p>
    <p>You have been assigned to a new job:</p>
    <ul>
      <li><strong>Job Number:</strong> ${job.job_number}</li>
      <li><strong>Title:</strong> ${job.title}</li>
      <li><strong>Customer:</strong> ${customer.name}</li>
      <li><strong>Scheduled:</strong> ${new Date(job.scheduled_date).toLocaleString()}</li>
      <li><strong>Location:</strong> ${job.location_address || 'N/A'}</li>
    </ul>
    <p>${job.description || ''}</p>
    <p>Please log in to view full details.</p>
  `;

  return await sendEmail({
    to: technician.email,
    subject,
    html,
    text: `New Job Assignment: ${job.job_number} - ${job.title}`
  });
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(invoice, customer, invoicePdfUrl = null) {
  const subject = `Invoice ${invoice.invoice_number}`;

  const attachments = invoicePdfUrl ? [{
    filename: `invoice_${invoice.invoice_number}.pdf`,
    path: invoicePdfUrl
  }] : [];

  const html = `
    <h2>Invoice ${invoice.invoice_number}</h2>
    <p>Dear ${customer.name},</p>
    <p>Please find your invoice attached.</p>
    <ul>
      <li><strong>Invoice Number:</strong> ${invoice.invoice_number}</li>
      <li><strong>Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</li>
      <li><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</li>
      <li><strong>Amount:</strong> $${invoice.total_amount.toFixed(2)}</li>
    </ul>
    <p>Thank you for your business!</p>
  `;

  return await sendEmail({
    to: customer.email,
    subject,
    html,
    text: `Invoice ${invoice.invoice_number} - Amount Due: $${invoice.total_amount.toFixed(2)}`,
    attachments
  });
}

/**
 * Send quotation email
 */
export async function sendQuotationEmail(quotation, customer, quotePdfUrl = null) {
  const subject = `Quotation ${quotation.quote_number}`;

  const attachments = quotePdfUrl ? [{
    filename: `quotation_${quotation.quote_number}.pdf`,
    path: quotePdfUrl
  }] : [];

  const html = `
    <h2>Quotation ${quotation.quote_number}</h2>
    <p>Dear ${customer.name},</p>
    <p>Please find your quotation attached.</p>
    <ul>
      <li><strong>Quote Number:</strong> ${quotation.quote_number}</li>
      <li><strong>Date:</strong> ${new Date(quotation.issue_date).toLocaleDateString()}</li>
      <li><strong>Valid Until:</strong> ${new Date(quotation.valid_until).toLocaleDateString()}</li>
      <li><strong>Amount:</strong> $${quotation.total_amount.toFixed(2)}</li>
    </ul>
    <p>Please review and let us know if you have any questions.</p>
  `;

  return await sendEmail({
    to: customer.email,
    subject,
    html,
    text: `Quotation ${quotation.quote_number} - Total: $${quotation.total_amount.toFixed(2)}`,
    attachments
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken, resetUrl) {
  const subject = 'Password Reset Request';

  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}?token=${resetToken}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Password reset link: ${resetUrl}?token=${resetToken}`
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(user) {
  const subject = 'Welcome to FieldPro FSM';

  const html = `
    <h2>Welcome to FieldPro FSM!</h2>
    <p>Hi ${user.name},</p>
    <p>Your account has been created successfully.</p>
    <p>You can now log in and start managing your field service operations.</p>
    <p>If you have any questions, please don't hesitate to contact us.</p>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text: `Welcome to FieldPro FSM, ${user.name}!`
  });
}

export default {
  sendEmail,
  sendJobAssignmentEmail,
  sendInvoiceEmail,
  sendQuotationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};

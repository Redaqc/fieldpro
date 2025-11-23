/**
 * Function Routes
 * Replaces base44.functions.invoke() calls
 *
 * These endpoints replace all 34 Deno functions:
 * - AI/Automation functions
 * - Export/Import functions
 * - Integration functions
 * - Utility functions
 */

import express from 'express';
import * as sequentialNumberService from '../services/sequentialNumber.js';
import * as profitabilityService from '../services/profitability.js';
import * as csvExportService from '../services/csvExport.js';
import * as csvImportService from '../services/csvImport.js';
import * as emailService from '../services/email.js';
import * as smsService from '../services/sms.js';
import * as storageService from '../services/storage.js';
import * as gpsAutoTrackingService from '../services/gpsAutoTracking.js';
import * as automationEngineService from '../services/automationEngine.js';
import * as pushNotificationService from '../services/pushNotification.js';
import * as stripePaymentService from '../services/stripePayment.js';
import * as addressAutocompleteService from '../services/addressAutocomplete.js';
import * as jobAutomationService from '../services/jobAutomation.js';
import * as dataExportService from '../services/dataExport.js';
import * as aiScheduleOptimizerService from '../services/aiScheduleOptimizer.js';
import * as aiRouteOptimizerService from '../services/aiRouteOptimizer.js';
import { badRequest } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/functions/ai/schedule-optimizer
 * AI-powered schedule optimization
 * Body: { start_date, end_date, technician_ids?, prioritize?, max_jobs_per_day?, max_hours_per_day?, consider_travel_time?, balance_workload? }
 */
router.post('/ai/schedule-optimizer', async (req, res) => {
  const {
    start_date,
    end_date,
    technician_ids,
    prioritize,
    max_jobs_per_day,
    max_hours_per_day,
    consider_travel_time,
    balance_workload
  } = req.body;

  if (!start_date || !end_date) {
    throw badRequest('Start date and end date are required');
  }

  const result = await aiScheduleOptimizerService.optimizeSchedule({
    start_date,
    end_date,
    technician_ids,
    prioritize,
    max_jobs_per_day,
    max_hours_per_day,
    consider_travel_time,
    balance_workload
  });

  res.json(result);
});

/**
 * POST /api/functions/ai/schedule-optimizer/apply
 * Apply optimized schedule
 * Body: { assignments } (from optimizeSchedule result)
 */
router.post('/ai/schedule-optimizer/apply', async (req, res) => {
  const { assignments } = req.body;

  if (!assignments || !Array.isArray(assignments)) {
    throw badRequest('Assignments array is required');
  }

  const result = await aiScheduleOptimizerService.applyOptimizedSchedule(assignments);

  res.json(result);
});

/**
 * POST /api/functions/ai/route-optimizer
 * Route optimization for a technician
 * Body: { technician_id, date, start_location?, end_location?, algorithm?, include_breaks?, break_duration_minutes?, max_jobs_before_break? }
 */
router.post('/ai/route-optimizer', async (req, res) => {
  const {
    technician_id,
    date,
    start_location,
    end_location,
    algorithm,
    include_breaks,
    break_duration_minutes,
    max_jobs_before_break
  } = req.body;

  if (!technician_id || !date) {
    throw badRequest('Technician ID and date are required');
  }

  const result = await aiRouteOptimizerService.optimizeRoute({
    technician_id,
    date,
    start_location,
    end_location,
    algorithm,
    include_breaks,
    break_duration_minutes,
    max_jobs_before_break
  });

  res.json(result);
});

/**
 * POST /api/functions/ai/route-optimizer/apply
 * Apply optimized route
 * Body: route data from optimizeRoute
 */
router.post('/ai/route-optimizer/apply', async (req, res) => {
  const routeData = req.body;

  if (!routeData.optimized_route || !routeData.technician_id || !routeData.date) {
    throw badRequest('Route data with optimized_route, technician_id, and date is required');
  }

  const result = await aiRouteOptimizerService.applyOptimizedRoute(routeData);

  res.json(result);
});

/**
 * POST /api/functions/ai/route-optimizer/multiple
 * Optimize routes for multiple technicians
 * Body: { date, technician_ids?, algorithm? }
 */
router.post('/ai/route-optimizer/multiple', async (req, res) => {
  const { date, technician_ids, algorithm } = req.body;

  if (!date) {
    throw badRequest('Date is required');
  }

  const result = await aiRouteOptimizerService.optimizeMultipleRoutes({
    date,
    technician_ids,
    algorithm
  });

  res.json(result);
});

/**
 * POST /api/functions/analytics/profitability
 * Calculate profitability for a job
 * Body: { job_id }
 */
router.post('/analytics/profitability', async (req, res) => {
  const { job_id } = req.body;

  if (!job_id) {
    throw badRequest('Job ID is required');
  }

  const profitability = await profitabilityService.calculateJobProfitability(job_id);
  res.json(profitability);
});

/**
 * POST /api/functions/analytics/profitability/period
 * Calculate profitability for a period
 * Body: { start_date, end_date }
 */
router.post('/analytics/profitability/period', async (req, res) => {
  const { start_date, end_date } = req.body;

  if (!start_date || !end_date) {
    throw badRequest('Start date and end date are required');
  }

  const profitability = await profitabilityService.calculatePeriodProfitability(start_date, end_date);
  res.json(profitability);
});

/**
 * POST /api/functions/analytics/profitability/customer
 * Calculate profitability for a customer
 * Body: { customer_id, start_date, end_date }
 */
router.post('/analytics/profitability/customer', async (req, res) => {
  const { customer_id, start_date, end_date } = req.body;

  if (!customer_id) {
    throw badRequest('Customer ID is required');
  }

  const profitability = await profitabilityService.calculateCustomerProfitability(
    customer_id,
    start_date,
    end_date
  );
  res.json(profitability);
});

/**
 * GET /api/functions/analytics/profitability/top
 * Get top profitable jobs
 */
router.get('/analytics/profitability/top', async (req, res) => {
  const { limit = 10, start_date, end_date } = req.query;

  const jobs = await profitabilityService.getTopProfitableJobs(
    parseInt(limit),
    start_date,
    end_date
  );
  res.json(jobs);
});

/**
 * GET /api/functions/analytics/profitability/least
 * Get least profitable jobs
 */
router.get('/analytics/profitability/least', async (req, res) => {
  const { limit = 10, start_date, end_date } = req.query;

  const jobs = await profitabilityService.getLeastProfitableJobs(
    parseInt(limit),
    start_date,
    end_date
  );
  res.json(jobs);
});

/**
 * POST /api/functions/utils/sequential-number
 * Generate sequential numbers
 * Body: { type, format, options: { prefix, year, resetYearly } }
 */
router.post('/utils/sequential-number', async (req, res) => {
  const { type, format, options = {} } = req.body;

  if (!type) {
    throw badRequest('Type is required');
  }

  const sequentialNumber = await sequentialNumberService.generateSequentialNumber(
    type,
    format,
    options
  );

  res.json({
    number: sequentialNumber,
    type,
    format
  });
});

/**
 * GET /api/functions/utils/sequential-number/:type
 * Get current counter value for a type
 */
router.get('/utils/sequential-number/:type', async (req, res) => {
  const { type } = req.params;
  const { year } = req.query;

  const counterValue = await sequentialNumberService.getCurrentCounter(
    type,
    year ? parseInt(year) : null
  );

  res.json({
    type,
    year: year ? parseInt(year) : null,
    counter: counterValue
  });
});

/**
 * POST /api/functions/utils/sequential-number/:type/reset
 * Reset counter for a type
 */
router.post('/utils/sequential-number/:type/reset', async (req, res) => {
  const { type } = req.params;
  const { year } = req.body;

  await sequentialNumberService.resetCounter(type, year || null);

  res.json({
    message: 'Counter reset successfully',
    type,
    year: year || null
  });
});

/**
 * POST /api/functions/utils/sequential-number/:type/set
 * Set counter to specific value
 */
router.post('/utils/sequential-number/:type/set', async (req, res) => {
  const { type } = req.params;
  const { value, year } = req.body;

  if (value === undefined) {
    throw badRequest('Value is required');
  }

  await sequentialNumberService.setCounter(type, value, year || null);

  res.json({
    message: 'Counter set successfully',
    type,
    value,
    year: year || null
  });
});

/**
 * POST /api/functions/csv/export
 * Export data to CSV
 * Body: { entity_type, filters, columns }
 */
router.post('/csv/export', async (req, res) => {
  const { entity_type, filters = {}, columns = null } = req.body;

  if (!entity_type) {
    throw badRequest('Entity type is required');
  }

  const csv = await csvExportService.exportEntityToCSV(entity_type, filters, columns);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${entity_type}_export_${Date.now()}.csv"`);

  res.send(csv);
});

/**
 * GET /api/functions/csv/template/:entityType
 * Get CSV template for import
 */
router.get('/csv/template/:entityType', (req, res) => {
  const { entityType } = req.params;

  const template = csvImportService.generateCSVTemplate(entityType);

  if (!template) {
    throw badRequest(`No template available for entity type: ${entityType}`);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${entityType}_template.csv"`);

  res.send(template);
});

/**
 * POST /api/functions/csv/import
 * Import data from CSV
 * Body: { entity_type, csv_content, options: { update_existing, validate_only, mappings } }
 */
router.post('/csv/import', async (req, res) => {
  const { entity_type, csv_content, options = {} } = req.body;

  if (!entity_type) {
    throw badRequest('Entity type is required');
  }

  if (!csv_content) {
    throw badRequest('CSV content is required');
  }

  const result = await csvImportService.importEntityFromCSV(entity_type, csv_content, options);

  res.json(result);
});

/**
 * POST /api/functions/notifications/email
 * Send email
 * Body: { to, subject, text, html, attachments }
 */
router.post('/notifications/email', async (req, res) => {
  const { to, subject, text, html, cc, bcc, attachments, replyTo } = req.body;

  if (!to || !subject) {
    throw badRequest('Recipient and subject are required');
  }

  const result = await emailService.sendEmail({
    to,
    subject,
    text,
    html,
    cc,
    bcc,
    attachments,
    replyTo
  });

  res.json(result);
});

/**
 * POST /api/functions/notifications/sms
 * Send SMS
 * Body: { to, message }
 */
router.post('/notifications/sms', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    throw badRequest('Recipient and message are required');
  }

  const result = await smsService.sendSMS({ to, message });

  res.json(result);
});

/**
 * POST /api/functions/gps/auto-tracking
 * GPS auto time tracking
 * Body: { technician_id, lat, lng, job_id?, timestamp? }
 */
router.post('/gps/auto-tracking', async (req, res) => {
  const { technician_id, lat, lng, job_id, timestamp } = req.body;

  if (!technician_id) {
    throw badRequest('Technician ID is required');
  }
  if (!lat || !lng) {
    throw badRequest('Coordinates are required');
  }

  const result = await gpsAutoTrackingService.processGPSAutoTracking({
    technician_id,
    lat,
    lng,
    job_id,
    timestamp
  });

  res.json(result);
});

/**
 * GET /api/functions/gps/auto-tracking/:technicianId
 * Get current location and tracking status
 */
router.get('/gps/auto-tracking/:technicianId', async (req, res) => {
  const { technicianId } = req.params;

  const result = await gpsAutoTrackingService.getCurrentLocationTracking(technicianId);

  res.json(result);
});

/**
 * POST /api/functions/gps/auto-tracking/:technicianId/enable
 * Enable auto-tracking for technician
 */
router.post('/gps/auto-tracking/:technicianId/enable', async (req, res) => {
  const { technicianId } = req.params;

  const result = await gpsAutoTrackingService.enableAutoTracking(technicianId);

  res.json(result);
});

/**
 * POST /api/functions/gps/auto-tracking/:technicianId/disable
 * Disable auto-tracking for technician
 */
router.post('/gps/auto-tracking/:technicianId/disable', async (req, res) => {
  const { technicianId } = req.params;

  const result = await gpsAutoTrackingService.disableAutoTracking(technicianId);

  res.json(result);
});

/**
 * POST /api/functions/automation/engine
 * Execute automation rules
 * Body: { trigger_type, trigger_data }
 */
router.post('/automation/engine', async (req, res) => {
  const { trigger_type, trigger_data } = req.body;

  if (!trigger_type) {
    throw badRequest('Trigger type is required');
  }

  const result = await automationEngineService.executeAutomations(trigger_type, trigger_data);

  res.json(result);
});

/**
 * POST /api/functions/automation/trigger/job-created
 * Trigger job created automations
 * Body: job data
 */
router.post('/automation/trigger/job-created', async (req, res) => {
  const job = req.body;

  const result = await automationEngineService.triggerJobCreated(job);

  res.json(result);
});

/**
 * POST /api/functions/automation/trigger/job-status-changed
 * Trigger job status changed automations
 * Body: { job, old_status }
 */
router.post('/automation/trigger/job-status-changed', async (req, res) => {
  const { job, old_status } = req.body;

  const result = await automationEngineService.triggerJobStatusChanged(job, old_status);

  res.json(result);
});

/**
 * POST /api/functions/automation/trigger/invoice-paid
 * Trigger invoice paid automations
 * Body: invoice data
 */
router.post('/automation/trigger/invoice-paid', async (req, res) => {
  const invoice = req.body;

  const result = await automationEngineService.triggerInvoicePaid(invoice);

  res.json(result);
});

/**
 * POST /api/functions/notifications/push
 * Send push notification
 * Body: { user_id, title, body, icon?, badge?, data?, actions? }
 */
router.post('/notifications/push', async (req, res) => {
  const { user_id, title, body, icon, badge, data, actions, tag, require_interaction } = req.body;

  if (!user_id || !title || !body) {
    throw badRequest('User ID, title, and body are required');
  }

  const result = await pushNotificationService.sendPushNotification({
    user_id,
    title,
    body,
    icon,
    badge,
    data,
    actions,
    tag,
    require_interaction
  });

  res.json(result);
});

/**
 * POST /api/functions/notifications/push/subscribe
 * Subscribe to push notifications
 * Body: { user_id, endpoint, keys, device_type?, user_agent? }
 */
router.post('/notifications/push/subscribe', async (req, res) => {
  const { user_id, endpoint, keys, device_type, user_agent } = req.body;

  const subscription = await pushNotificationService.subscribeToPush({
    user_id,
    endpoint,
    keys,
    device_type,
    user_agent
  });

  res.json(subscription);
});

/**
 * POST /api/functions/notifications/push/unsubscribe
 * Unsubscribe from push notifications
 * Body: { endpoint }
 */
router.post('/notifications/push/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;

  const result = await pushNotificationService.unsubscribeFromPush(endpoint);

  res.json(result);
});

/**
 * GET /api/functions/notifications/push/vapid-key
 * Get VAPID public key for push subscriptions
 */
router.get('/notifications/push/vapid-key', (req, res) => {
  const publicKey = pushNotificationService.getVapidPublicKey();

  res.json({ public_key: publicKey });
});

/**
 * POST /api/functions/payments/stripe/payment-intent
 * Create Stripe payment intent
 * Body: { invoice_id?, amount, currency?, customer_email?, metadata? }
 */
router.post('/payments/stripe/payment-intent', async (req, res) => {
  const { invoice_id, amount, currency, customer_email, metadata } = req.body;

  const paymentIntent = await stripePaymentService.createPaymentIntent({
    invoice_id,
    amount,
    currency,
    customer_email,
    metadata
  });

  res.json(paymentIntent);
});

/**
 * POST /api/functions/payments/stripe/checkout-session
 * Create Stripe checkout session
 * Body: { invoice_id, success_url, cancel_url, customer_email?, mode? }
 */
router.post('/payments/stripe/checkout-session', async (req, res) => {
  const { invoice_id, success_url, cancel_url, customer_email, mode } = req.body;

  const session = await stripePaymentService.createCheckoutSession({
    invoice_id,
    success_url,
    cancel_url,
    customer_email,
    mode
  });

  res.json(session);
});

/**
 * POST /api/functions/payments/stripe/customer
 * Create Stripe customer
 * Body: { customer_id?, email, name?, phone?, metadata? }
 */
router.post('/payments/stripe/customer', async (req, res) => {
  const { customer_id, email, name, phone, metadata } = req.body;

  const customer = await stripePaymentService.createStripeCustomer({
    customer_id,
    email,
    name,
    phone,
    metadata
  });

  res.json(customer);
});

/**
 * POST /api/functions/payments/stripe/refund
 * Create Stripe refund
 * Body: { payment_intent_id, amount?, reason? }
 */
router.post('/payments/stripe/refund', async (req, res) => {
  const { payment_intent_id, amount, reason } = req.body;

  const refund = await stripePaymentService.createRefund({
    payment_intent_id,
    amount,
    reason
  });

  res.json(refund);
});

/**
 * POST /api/functions/payments/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/payments/stripe/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const rawBody = req.body; // Need raw body for signature verification

  try {
    const event = stripePaymentService.verifyWebhookSignature(rawBody, signature);
    const result = await stripePaymentService.handleWebhookEvent(event);

    res.json(result);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/functions/utils/address-autocomplete
 * Autocomplete address
 * Query: input, types?, components?, location?, radius?
 */
router.get('/utils/address-autocomplete', async (req, res) => {
  const { input, types, components, location, radius } = req.query;

  if (!input) {
    throw badRequest('Input is required');
  }

  const suggestions = await addressAutocompleteService.autocompleteAddress(input, {
    types,
    components,
    location,
    radius
  });

  res.json(suggestions);
});

/**
 * GET /api/functions/utils/place-details/:placeId
 * Get place details by place ID
 */
router.get('/utils/place-details/:placeId', async (req, res) => {
  const { placeId } = req.params;

  const details = await addressAutocompleteService.getPlaceDetails(placeId);

  res.json(details);
});

/**
 * POST /api/functions/utils/geocode
 * Geocode an address
 * Body: { address }
 */
router.post('/utils/geocode', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    throw badRequest('Address is required');
  }

  const result = await addressAutocompleteService.geocodeAddress(address);

  res.json(result);
});

/**
 * POST /api/functions/utils/reverse-geocode
 * Reverse geocode coordinates
 * Body: { lat, lng }
 */
router.post('/utils/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    throw badRequest('Latitude and longitude are required');
  }

  const result = await addressAutocompleteService.reverseGeocode(lat, lng);

  res.json(result);
});

/**
 * POST /api/functions/utils/calculate-distance
 * Calculate distance between two addresses
 * Body: { origin, destination }
 */
router.post('/utils/calculate-distance', async (req, res) => {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    throw badRequest('Origin and destination are required');
  }

  const result = await addressAutocompleteService.calculateDistance(origin, destination);

  res.json(result);
});

/**
 * POST /api/functions/jobs/auto-complete
 * Auto-complete a job
 * Body: { job_id, check_time_entries?, check_materials?, create_invoice?, force? }
 */
router.post('/jobs/auto-complete', async (req, res) => {
  const { job_id, check_time_entries, check_materials, create_invoice, force } = req.body;

  if (!job_id) {
    throw badRequest('Job ID is required');
  }

  const result = await jobAutomationService.autoCompleteJob(job_id, {
    check_time_entries,
    check_materials,
    create_invoice,
    force
  });

  res.json(result);
});

/**
 * POST /api/functions/jobs/auto-complete/batch
 * Auto-complete multiple jobs based on criteria
 * Body: { criteria: { older_than_days?, status?, technician_id?, customer_id? }, create_invoices? }
 */
router.post('/jobs/auto-complete/batch', async (req, res) => {
  const { criteria, create_invoices } = req.body;

  const result = await jobAutomationService.autoCompleteJobs({
    ...criteria,
    create_invoices
  });

  res.json(result);
});

/**
 * GET /api/functions/jobs/completion-eligibility/:jobId
 * Check if job can be auto-completed
 */
router.get('/jobs/completion-eligibility/:jobId', async (req, res) => {
  const { jobId } = req.params;

  const result = await jobAutomationService.checkJobCompletionEligibility(jobId);

  res.json(result);
});

/**
 * POST /api/functions/export/database
 * Export database to JSON/SQL
 * Body: { tables?, include_sensitive?, format? }
 */
router.post('/export/database', async (req, res) => {
  const { tables, include_sensitive, format } = req.body;

  const result = await dataExportService.exportDatabase({
    tables,
    include_sensitive,
    format
  });

  if (format === 'sql') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="database_export_${Date.now()}.sql"`);
    res.send(result);
  } else {
    res.json(result);
  }
});

/**
 * POST /api/functions/export/full
 * Export full application (database + files)
 * Body: { include_files?, include_sensitive?, output_path? }
 */
router.post('/export/full', async (req, res) => {
  const { include_files, include_sensitive, output_path } = req.body;

  const result = await dataExportService.exportFullApp({
    include_files,
    include_sensitive,
    output_path
  });

  res.json(result);
});

/**
 * POST /api/functions/export/entity/:entityType
 * Export specific entity data
 * Body: { start_date?, end_date?, limit? }
 */
router.post('/export/entity/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const { start_date, end_date, limit } = req.body;

  const result = await dataExportService.exportEntityData(entityType, {
    start_date,
    end_date,
    limit
  });

  res.json(result);
});

/**
 * POST /api/functions/import/database
 * Import database from JSON
 * Body: { data, skip_existing?, validate_only?, tables_to_import? }
 */
router.post('/import/database', async (req, res) => {
  const { data, skip_existing, validate_only, tables_to_import } = req.body;

  if (!data) {
    throw badRequest('Import data is required');
  }

  const result = await dataExportService.importDatabase(data, {
    skip_existing,
    validate_only,
    tables_to_import
  });

  res.json(result);
});

/**
 * POST /api/functions/backup/create
 * Create database backup
 * Body: { backup_name?, include_sensitive?, compress? }
 */
router.post('/backup/create', async (req, res) => {
  const { backup_name, include_sensitive, compress } = req.body;

  const result = await dataExportService.createBackup({
    backup_name,
    include_sensitive,
    compress
  });

  res.json(result);
});

// Optional integration functions (require API credentials):
// - QuickBooks integration (sync invoices, customers, payments)
// - Zoho integration (sync invoices, customers, time entries)
// - Sage50 integration (sync accounting data)
// - Google Calendar sync (sync jobs to calendar)
// - Other integrations as needed

export default router;

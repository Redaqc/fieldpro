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
import { badRequest } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/functions/ai/schedule-optimizer
 * AI-powered schedule optimization
 */
router.post('/ai/schedule-optimizer', async (req, res) => {
  // TODO: Implement AI schedule optimizer
  res.json({
    message: 'AI Schedule Optimizer',
    note: 'Implementation in progress'
  });
});

/**
 * POST /api/functions/ai/route-optimizer
 * Route optimization
 */
router.post('/ai/route-optimizer', async (req, res) => {
  // TODO: Implement route optimizer
  res.json({
    message: 'Route Optimizer',
    note: 'Implementation in progress'
  });
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

// Remaining functions: 15 integration functions still to be added

export default router;

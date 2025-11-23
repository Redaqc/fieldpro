/**
 * Third-Party Integrations Routes
 * API endpoints for accounting and calendar integrations
 */

import express from 'express';
import * as integrationsService from '../services/integrations.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all integration routes
router.use(authenticateToken);

// ============================================
// QUICKBOOKS ROUTES
// ============================================

/**
 * POST /api/integrations/quickbooks/sync-customers
 * Sync customers to QuickBooks
 */
router.post('/quickbooks/sync-customers', async (req, res, next) => {
  try {
    const result = await integrationsService.quickbooks.syncCustomers(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/quickbooks/sync-invoices
 * Sync invoices to QuickBooks
 */
router.post('/quickbooks/sync-invoices', async (req, res, next) => {
  try {
    const result = await integrationsService.quickbooks.syncInvoices(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/quickbooks/sync-payments
 * Sync payments to QuickBooks
 */
router.post('/quickbooks/sync-payments', async (req, res, next) => {
  try {
    const result = await integrationsService.quickbooks.syncPayments(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/quickbooks/import-chart-of-accounts
 * Import chart of accounts from QuickBooks
 */
router.post('/quickbooks/import-chart-of-accounts', async (req, res, next) => {
  try {
    const result = await integrationsService.quickbooks.importChartOfAccounts();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/quickbooks/status
 * Get QuickBooks connection status
 */
router.get('/quickbooks/status', async (req, res, next) => {
  try {
    const result = await integrationsService.quickbooks.getStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// ZOHO BOOKS ROUTES
// ============================================

/**
 * POST /api/integrations/zoho/sync-customers
 * Sync customers to Zoho Books
 */
router.post('/zoho/sync-customers', async (req, res, next) => {
  try {
    const result = await integrationsService.zoho.syncCustomers(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/zoho/sync-invoices
 * Sync invoices to Zoho Books
 */
router.post('/zoho/sync-invoices', async (req, res, next) => {
  try {
    const result = await integrationsService.zoho.syncInvoices(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/zoho/sync-time-entries
 * Sync time entries to Zoho Books
 */
router.post('/zoho/sync-time-entries', async (req, res, next) => {
  try {
    const result = await integrationsService.zoho.syncTimeEntries(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/zoho/import-items
 * Import items from Zoho Books
 */
router.post('/zoho/import-items', async (req, res, next) => {
  try {
    const result = await integrationsService.zoho.importItems();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/zoho/status
 * Get Zoho connection status
 */
router.get('/zoho/status', async (req, res, next) => {
  try {
    const result = await integrationsService.zoho.getStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// SAGE 50 ROUTES
// ============================================

/**
 * POST /api/integrations/sage50/export
 * Export data for Sage 50 import (CSV format)
 * Body: { entity_type: 'customers' | 'invoices' | 'payments', filters: {} }
 */
router.post('/sage50/export', async (req, res, next) => {
  try {
    const { entity_type, filters } = req.body;
    const result = await integrationsService.sage50.exportForSage50(entity_type, { filters });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/sage50/import
 * Import data from Sage 50 (CSV format)
 * Body: { entity_type: 'customers' | 'invoices', csv_data: string }
 */
router.post('/sage50/import', async (req, res, next) => {
  try {
    const { entity_type, csv_data } = req.body;
    const result = await integrationsService.sage50.importFromSage50(entity_type, csv_data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/sage50/sync
 * Generic sync operation for Sage 50
 * Body: { operation: 'export_customers' | 'import_customers' | etc, csv_data?: string }
 */
router.post('/sage50/sync', async (req, res, next) => {
  try {
    const { operation, csv_data } = req.body;
    const result = await integrationsService.sage50.sync(operation, csv_data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/sage50/status
 * Get Sage 50 integration status
 */
router.get('/sage50/status', async (req, res, next) => {
  try {
    const result = await integrationsService.sage50.getStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// GOOGLE CALENDAR ROUTES
// ============================================

/**
 * POST /api/integrations/google-calendar/sync-jobs
 * Sync jobs to Google Calendar
 */
router.post('/google-calendar/sync-jobs', async (req, res, next) => {
  try {
    const result = await integrationsService.googleCalendar.syncJobs(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/google-calendar/create-event
 * Create calendar event from job
 * Body: { job: { id, title, scheduled_start, scheduled_end, ... } }
 */
router.post('/google-calendar/create-event', async (req, res, next) => {
  try {
    const { job } = req.body;
    const result = await integrationsService.googleCalendar.createEvent(job);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/integrations/google-calendar/update-event/:eventId
 * Update calendar event
 */
router.put('/google-calendar/update-event/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await integrationsService.googleCalendar.updateEvent(eventId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/integrations/google-calendar/delete-event/:eventId
 * Delete calendar event
 */
router.delete('/google-calendar/delete-event/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await integrationsService.googleCalendar.deleteEvent(eventId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/google-calendar/status
 * Get Google Calendar connection status
 */
router.get('/google-calendar/status', async (req, res, next) => {
  try {
    const result = await integrationsService.googleCalendar.getStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// GENERAL INTEGRATION STATUS
// ============================================

/**
 * GET /api/integrations/status
 * Get status of all integrations
 */
router.get('/status', async (req, res, next) => {
  try {
    const result = await integrationsService.getAllIntegrationsStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

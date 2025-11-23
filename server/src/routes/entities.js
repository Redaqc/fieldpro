/**
 * Entity CRUD Routes
 * Replaces base44.entities.* calls
 *
 * This will handle all 40+ entities:
 * - Customer, Technician, Job, ServiceCall
 * - Invoice, Payment, Quotation
 * - TimeEntry, Material, Asset
 * - And all other entities
 */

import express from 'express';
import Customer from '../models/Customer.js';
import Job from '../models/Job.js';
import Invoice from '../models/Invoice.js';
import TimeEntry from '../models/TimeEntry.js';
import Technician from '../models/Technician.js';
import Material from '../models/Material.js';
import Payment from '../models/Payment.js';
import ServiceCall from '../models/ServiceCall.js';
import Quotation from '../models/Quotation.js';
import { badRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// Entity model mapping
const entityModels = {
  customers: Customer,
  jobs: Job,
  invoices: Invoice,
  time_entries: TimeEntry,
  technicians: Technician,
  materials: Material,
  payments: Payment,
  service_calls: ServiceCall,
  quotations: Quotation,
  // TODO: Add remaining entity models as they're implemented
  // assets: Asset,
  // gps_tracking: GPSTracking,
  // notifications: Notification,
  // etc.
};

/**
 * Get model for entity type
 */
function getModel(entityType) {
  const model = entityModels[entityType.toLowerCase()];
  if (!model) {
    throw badRequest(`Entity type '${entityType}' not implemented yet`);
  }
  return model;
}

/**
 * GET /api/entities/:entityType
 * List all entities of a type
 */
router.get('/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const model = getModel(entityType);

  const options = {
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0,
    sortBy: req.query.sortBy || 'created_at',
    sortOrder: req.query.sortOrder || 'DESC'
  };

  // Add entity-specific filters
  if (req.query.is_active !== undefined) {
    options.is_active = req.query.is_active === 'true';
  }

  const result = await model.list(options);
  res.json(result);
});

/**
 * GET /api/entities/:entityType/:id
 * Get single entity by ID
 */
router.get('/:entityType/:id', async (req, res) => {
  const { entityType, id } = req.params;
  const model = getModel(entityType);

  // Check if we should include relations
  const withRelations = req.query.with_relations === 'true';

  const entity = withRelations && model.findWithRelations
    ? await model.findWithRelations(id)
    : await model.findById(id);

  res.json(entity);
});

/**
 * POST /api/entities/:entityType
 * Create new entity
 */
router.post('/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const model = getModel(entityType);
  const data = req.body;

  const entity = await model.create(data);
  res.status(201).json(entity);
});

/**
 * PUT /api/entities/:entityType/:id
 * Update entity
 */
router.put('/:entityType/:id', async (req, res) => {
  const { entityType, id } = req.params;
  const model = getModel(entityType);
  const data = req.body;

  const entity = await model.update(id, data);
  res.json(entity);
});

/**
 * DELETE /api/entities/:entityType/:id
 * Delete entity
 */
router.delete('/:entityType/:id', async (req, res) => {
  const { entityType, id } = req.params;
  const model = getModel(entityType);

  await model.delete(id);
  res.json({ message: 'Entity deleted successfully', id });
});

/**
 * POST /api/entities/:entityType/filter
 * Filter entities with conditions
 */
router.post('/:entityType/filter', async (req, res) => {
  const { entityType } = req.params;
  const model = getModel(entityType);
  const filters = req.body;

  const entities = await model.filter(filters);
  res.json(entities);
});

/**
 * GET /api/entities/:entityType/search
 * Search entities by text
 */
router.get('/:entityType/search', async (req, res) => {
  const { entityType } = req.params;
  const model = getModel(entityType);
  const { q } = req.query;

  if (!q) {
    throw badRequest('Search query parameter "q" is required');
  }

  const entities = model.search
    ? await model.search(q)
    : await model.filter({ search: q });

  res.json(entities);
});

/**
 * POST /api/entities/:entityType/:id/archive
 * Archive entity (soft delete)
 */
router.post('/:entityType/:id/archive', async (req, res) => {
  const { entityType, id } = req.params;
  const model = getModel(entityType);

  if (!model.archive) {
    throw badRequest(`Archive not supported for ${entityType}`);
  }

  const entity = await model.archive(id);
  res.json(entity);
});

/**
 * POST /api/entities/:entityType/:id/restore
 * Restore archived entity
 */
router.post('/:entityType/:id/restore', async (req, res) => {
  const { entityType, id } = req.params;
  const model = getModel(entityType);

  if (!model.restore) {
    throw badRequest(`Restore not supported for ${entityType}`);
  }

  const entity = await model.restore(id);
  res.json(entity);
});

export default router;

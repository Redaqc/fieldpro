/**
 * Job Automation Service
 * Auto-complete jobs and other job automation features
 * Replaces Base44 autoCompleteJob function
 */

import { query, transaction } from '../database/config.js';
import { Job } from '../models/Job.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { Invoice } from '../models/Invoice.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Auto-complete job based on criteria
 * @param {string} jobId - Job ID
 * @param {Object} options - Auto-complete options
 * @returns {Promise<Object>} Result
 */
export async function autoCompleteJob(jobId, options = {}) {
  if (!jobId) {
    throw badRequest('Job ID is required');
  }

  const {
    check_time_entries = true,
    check_materials = true,
    create_invoice = false,
    force = false
  } = options;

  const job = await Job.findById(jobId);

  if (job.status === 'completed') {
    return {
      success: false,
      message: 'Job is already completed',
      job
    };
  }

  if (job.status === 'cancelled') {
    return {
      success: false,
      message: 'Cannot complete cancelled job',
      job
    };
  }

  const checks = {
    time_entries_complete: false,
    materials_recorded: false,
    can_complete: false,
    warnings: []
  };

  // Check if all time entries are completed
  if (check_time_entries) {
    const activeTimeEntries = await query(
      `SELECT * FROM time_entries WHERE job_id = $1 AND status = 'in_progress'`,
      [jobId]
    );

    if (activeTimeEntries.rows.length > 0) {
      checks.warnings.push(`${activeTimeEntries.rows.length} active time entries found`);

      if (!force) {
        return {
          success: false,
          message: 'Cannot complete job with active time entries',
          checks,
          job
        };
      }
    }

    checks.time_entries_complete = activeTimeEntries.rows.length === 0;
  }

  // Check if materials are recorded
  if (check_materials) {
    const materials = await query(
      'SELECT * FROM job_materials WHERE job_id = $1',
      [jobId]
    );

    checks.materials_recorded = materials.rows.length > 0;

    if (materials.rows.length === 0) {
      checks.warnings.push('No materials recorded for this job');
    }
  }

  checks.can_complete = force || (checks.time_entries_complete && (!check_materials || checks.materials_recorded));

  if (!checks.can_complete && !force) {
    return {
      success: false,
      message: 'Job does not meet completion criteria',
      checks,
      job
    };
  }

  // Complete the job
  const completedJob = await Job.update(jobId, {
    status: 'completed',
    actual_end: new Date()
  });

  // Optionally create invoice
  let invoice = null;
  if (create_invoice) {
    invoice = await createInvoiceFromJob(jobId);
  }

  return {
    success: true,
    message: 'Job completed successfully',
    job: completedJob,
    invoice,
    checks
  };
}

/**
 * Auto-complete jobs based on criteria
 * @param {Object} criteria - Selection criteria
 * @returns {Promise<Object>} Result
 */
export async function autoCompleteJobs(criteria = {}) {
  const {
    older_than_days = null,
    status = 'in_progress',
    technician_id = null,
    customer_id = null,
    create_invoices = false
  } = criteria;

  const conditions = [`status = $1`];
  const values = [status];
  let paramCount = 2;

  if (older_than_days) {
    conditions.push(`actual_start < NOW() - INTERVAL '${older_than_days} days'`);
  }

  if (technician_id) {
    conditions.push(`assigned_to = $${paramCount}`);
    values.push(technician_id);
    paramCount++;
  }

  if (customer_id) {
    conditions.push(`customer_id = $${paramCount}`);
    values.push(customer_id);
    paramCount++;
  }

  const jobs = await query(
    `SELECT * FROM jobs WHERE ${conditions.join(' AND ')} ORDER BY actual_start ASC`,
    values
  );

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const job of jobs.rows) {
    try {
      const result = await autoCompleteJob(job.id, {
        check_time_entries: true,
        check_materials: false,
        create_invoice: create_invoices,
        force: false
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      results.push({
        job_id: job.id,
        job_number: job.job_number,
        ...result
      });
    } catch (error) {
      failureCount++;
      results.push({
        job_id: job.id,
        job_number: job.job_number,
        success: false,
        error: error.message
      });
    }
  }

  return {
    total_jobs: jobs.rows.length,
    completed: successCount,
    failed: failureCount,
    results
  };
}

/**
 * Create invoice from completed job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Created invoice
 */
async function createInvoiceFromJob(jobId) {
  const job = await Job.findById(jobId);

  return await transaction(async (client) => {
    // Generate invoice number
    const { generateSequentialNumber } = await import('./sequentialNumber.js');
    const invoiceNumber = await generateSequentialNumber('invoice', 'INV-{YYYY}-{####}');

    // Calculate totals from time entries and materials
    const timeEntries = await client.query(
      'SELECT * FROM time_entries WHERE job_id = $1',
      [jobId]
    );

    const materials = await client.query(
      'SELECT * FROM job_materials WHERE job_id = $1',
      [jobId]
    );

    let laborTotal = 0;
    const laborLineItems = [];

    for (const entry of timeEntries.rows) {
      const amount = (entry.billable_hours || entry.total_hours || 0) * (entry.hourly_rate || 0);
      laborTotal += amount;

      laborLineItems.push({
        item_type: 'labor',
        description: `Labor - ${entry.technician_name || 'Technician'}`,
        quantity: entry.billable_hours || entry.total_hours || 0,
        unit_price: entry.hourly_rate || 0,
        total_price: amount
      });
    }

    let materialsTotal = 0;
    const materialLineItems = [];

    for (const material of materials.rows) {
      materialsTotal += parseFloat(material.total_price || 0);

      materialLineItems.push({
        item_type: 'product',
        description: material.material_name || 'Material',
        quantity: material.quantity,
        unit_price: material.unit_price,
        total_price: material.total_price
      });
    }

    const lineItems = [...laborLineItems, ...materialLineItems];
    const subtotal = laborTotal + materialsTotal;
    const taxAmount = subtotal * 0.08; // 8% tax, should be configurable
    const totalAmount = subtotal + taxAmount;

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number, customer_id, job_id, issue_date, due_date,
        status, subtotal, tax_amount, total_amount, balance,
        created_at, updated_at
      ) VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days', 'draft', $4, $5, $6, $6, NOW(), NOW())
      RETURNING *`,
      [invoiceNumber, job.customer_id, jobId, subtotal, taxAmount, totalAmount]
    );

    const invoice = invoiceResult.rows[0];

    // Create line items
    for (const [index, item] of lineItems.entries()) {
      await client.query(
        `INSERT INTO invoice_line_items (
          invoice_id, item_type, description, quantity, unit_price, total_price, line_order, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [invoice.id, item.item_type, item.description, item.quantity, item.unit_price, item.total_price, index]
      );
    }

    return invoice;
  });
}

/**
 * Check if job can be auto-completed
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Eligibility check
 */
export async function checkJobCompletionEligibility(jobId) {
  const job = await Job.findById(jobId);

  if (job.status === 'completed') {
    return {
      eligible: false,
      reason: 'Job is already completed',
      job
    };
  }

  if (job.status === 'cancelled') {
    return {
      eligible: false,
      reason: 'Job is cancelled',
      job
    };
  }

  // Check active time entries
  const activeTimeEntries = await query(
    `SELECT * FROM time_entries WHERE job_id = $1 AND status = 'in_progress'`,
    [jobId]
  );

  // Check if job has been started
  const hasTimeEntries = await query(
    'SELECT COUNT(*) as count FROM time_entries WHERE job_id = $1',
    [jobId]
  );

  const hasMaterials = await query(
    'SELECT COUNT(*) as count FROM job_materials WHERE job_id = $1',
    [jobId]
  );

  const eligible = activeTimeEntries.rows.length === 0 &&
                   parseInt(hasTimeEntries.rows[0].count) > 0;

  const warnings = [];

  if (activeTimeEntries.rows.length > 0) {
    warnings.push(`${activeTimeEntries.rows.length} active time entries`);
  }

  if (parseInt(hasTimeEntries.rows[0].count) === 0) {
    warnings.push('No time entries recorded');
  }

  if (parseInt(hasMaterials.rows[0].count) === 0) {
    warnings.push('No materials recorded');
  }

  return {
    eligible,
    reason: eligible ? 'Job meets completion criteria' : warnings.join(', '),
    warnings,
    job,
    stats: {
      active_time_entries: activeTimeEntries.rows.length,
      total_time_entries: parseInt(hasTimeEntries.rows[0].count),
      materials_count: parseInt(hasMaterials.rows[0].count)
    }
  };
}

/**
 * Schedule auto-completion for jobs
 * @param {Object} schedule - Schedule configuration
 * @returns {Promise<Object>} Scheduled task info
 */
export async function scheduleAutoCompletion(schedule) {
  const {
    criteria,
    cron_expression = '0 0 * * *', // Daily at midnight
    enabled = true
  } = schedule;

  // In production, this would integrate with a job scheduler like node-cron or bull
  // For now, return configuration
  return {
    id: Date.now().toString(),
    criteria,
    cron_expression,
    enabled,
    next_run: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    created_at: new Date()
  };
}

export default {
  autoCompleteJob,
  autoCompleteJobs,
  checkJobCompletionEligibility,
  scheduleAutoCompletion
};

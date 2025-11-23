/**
 * Profitability Calculator Service
 * Calculates profitability for jobs based on revenue and costs
 * Replaces Base44 function: calculateProfitability
 */

import { query } from '../database/config.js';
import { notFound } from '../middleware/errorHandler.js';

/**
 * Calculate profitability for a job
 * @param {string} jobId - Job UUID
 * @returns {Promise<Object>} Profitability data
 */
export async function calculateJobProfitability(jobId) {
  // Get job details
  const jobResult = await query(
    'SELECT * FROM jobs WHERE id = $1',
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    throw notFound(`Job with ID ${jobId} not found`);
  }

  const job = jobResult.rows[0];

  // Get total revenue from invoices
  const invoiceResult = await query(
    `SELECT
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(SUM(paid_amount), 0) as total_paid
     FROM invoices
     WHERE job_id = $1`,
    [jobId]
  );

  const revenue = invoiceResult.rows[0];

  // Get labor costs from time entries
  const laborResult = await query(
    `SELECT
      COALESCE(SUM(duration_hours), 0) as total_hours,
      COALESCE(SUM(total_cost), 0) as total_labor_cost,
      COUNT(*) as time_entry_count
     FROM time_entries
     WHERE job_id = $1`,
    [jobId]
  );

  const labor = laborResult.rows[0];

  // Get material costs
  const materialResult = await query(
    `SELECT
      COALESCE(SUM(jm.quantity_used * m.cost_price), 0) as total_material_cost,
      COALESCE(SUM(jm.quantity_used * m.unit_price), 0) as total_material_revenue,
      COUNT(*) as material_count
     FROM job_materials jm
     JOIN materials m ON jm.material_id = m.id
     WHERE jm.job_id = $1`,
    [jobId]
  );

  const materials = materialResult.rows[0];

  // Calculate totals
  const totalRevenue = parseFloat(revenue.total_revenue) || 0;
  const totalPaid = parseFloat(revenue.total_paid) || 0;
  const totalLaborCost = parseFloat(labor.total_labor_cost) || 0;
  const totalMaterialCost = parseFloat(materials.total_material_cost) || 0;
  const totalCost = totalLaborCost + totalMaterialCost;
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const profitability = {
    job_id: jobId,
    job_number: job.job_number,
    job_title: job.title,
    job_status: job.status,

    // Revenue
    total_revenue: totalRevenue,
    total_paid: totalPaid,
    outstanding_balance: totalRevenue - totalPaid,

    // Costs
    labor_cost: totalLaborCost,
    material_cost: totalMaterialCost,
    total_cost: totalCost,

    // Labor details
    total_hours: parseFloat(labor.total_hours) || 0,
    time_entry_count: parseInt(labor.time_entry_count) || 0,

    // Material details
    material_revenue: parseFloat(materials.total_material_revenue) || 0,
    material_profit: (parseFloat(materials.total_material_revenue) || 0) - totalMaterialCost,
    material_count: parseInt(materials.material_count) || 0,

    // Profitability metrics
    gross_profit: grossProfit,
    profit_margin_percentage: profitMargin.toFixed(2),
    is_profitable: grossProfit > 0,

    // Additional metrics
    labor_efficiency: totalRevenue > 0 && labor.total_hours > 0
      ? (totalRevenue / parseFloat(labor.total_hours)).toFixed(2)
      : 0,
    cost_to_revenue_ratio: totalRevenue > 0
      ? ((totalCost / totalRevenue) * 100).toFixed(2)
      : 0,

    calculated_at: new Date().toISOString()
  };

  // Store profitability record
  await query(
    `INSERT INTO profitability_records (
      job_id, total_revenue, total_cost, labor_cost, material_cost,
      gross_profit, profit_margin, calculated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      jobId,
      totalRevenue,
      totalCost,
      totalLaborCost,
      totalMaterialCost,
      grossProfit,
      profitMargin,
      new Date()
    ]
  );

  return profitability;
}

/**
 * Calculate profitability for all jobs in a date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Object>} Aggregate profitability data
 */
export async function calculatePeriodProfitability(startDate, endDate) {
  const result = await query(
    `SELECT
      COUNT(DISTINCT j.id) as total_jobs,
      COALESCE(SUM(i.total_amount), 0) as total_revenue,
      COALESCE(SUM(i.paid_amount), 0) as total_paid,
      COALESCE(SUM(te.total_cost), 0) as total_labor_cost,
      COALESCE(SUM(te.duration_hours), 0) as total_hours
     FROM jobs j
     LEFT JOIN invoices i ON j.id = i.job_id
     LEFT JOIN time_entries te ON j.id = te.job_id
     WHERE j.scheduled_date >= $1 AND j.scheduled_date <= $2`,
    [startDate, endDate]
  );

  // Get material costs separately
  const materialResult = await query(
    `SELECT
      COALESCE(SUM(jm.quantity_used * m.cost_price), 0) as total_material_cost
     FROM jobs j
     JOIN job_materials jm ON j.id = jm.job_id
     JOIN materials m ON jm.material_id = m.id
     WHERE j.scheduled_date >= $1 AND j.scheduled_date <= $2`,
    [startDate, endDate]
  );

  const data = result.rows[0];
  const totalRevenue = parseFloat(data.total_revenue) || 0;
  const totalPaid = parseFloat(data.total_paid) || 0;
  const totalLaborCost = parseFloat(data.total_labor_cost) || 0;
  const totalMaterialCost = parseFloat(materialResult.rows[0].total_material_cost) || 0;
  const totalCost = totalLaborCost + totalMaterialCost;
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    period_start: startDate,
    period_end: endDate,
    total_jobs: parseInt(data.total_jobs) || 0,
    total_revenue: totalRevenue,
    total_paid: totalPaid,
    outstanding_balance: totalRevenue - totalPaid,
    total_labor_cost: totalLaborCost,
    total_material_cost: totalMaterialCost,
    total_cost: totalCost,
    total_hours: parseFloat(data.total_hours) || 0,
    gross_profit: grossProfit,
    profit_margin_percentage: profitMargin.toFixed(2),
    average_profit_per_job: data.total_jobs > 0 ? (grossProfit / data.total_jobs).toFixed(2) : 0,
    calculated_at: new Date().toISOString()
  };
}

/**
 * Calculate profitability by customer
 * @param {string} customerId - Customer UUID
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object>} Customer profitability data
 */
export async function calculateCustomerProfitability(customerId, startDate = null, endDate = null) {
  let dateFilter = '';
  const params = [customerId];

  if (startDate && endDate) {
    dateFilter = 'AND j.scheduled_date >= $2 AND j.scheduled_date <= $3';
    params.push(startDate, endDate);
  }

  const result = await query(
    `SELECT
      c.id,
      c.name,
      c.email,
      COUNT(DISTINCT j.id) as total_jobs,
      COALESCE(SUM(i.total_amount), 0) as total_revenue,
      COALESCE(SUM(i.paid_amount), 0) as total_paid,
      COALESCE(SUM(te.total_cost), 0) as total_labor_cost,
      COALESCE(SUM(te.duration_hours), 0) as total_hours
     FROM customers c
     LEFT JOIN jobs j ON c.id = j.customer_id
     LEFT JOIN invoices i ON j.id = i.job_id
     LEFT JOIN time_entries te ON j.id = te.job_id
     WHERE c.id = $1 ${dateFilter}
     GROUP BY c.id, c.name, c.email`,
    params
  );

  if (result.rows.length === 0) {
    throw notFound(`Customer with ID ${customerId} not found`);
  }

  const data = result.rows[0];
  const totalRevenue = parseFloat(data.total_revenue) || 0;
  const totalPaid = parseFloat(data.total_paid) || 0;
  const totalLaborCost = parseFloat(data.total_labor_cost) || 0;

  // Get material costs
  const materialParams = [customerId];
  if (startDate && endDate) {
    materialParams.push(startDate, endDate);
  }

  const materialResult = await query(
    `SELECT
      COALESCE(SUM(jm.quantity_used * m.cost_price), 0) as total_material_cost
     FROM jobs j
     JOIN job_materials jm ON j.id = jm.job_id
     JOIN materials m ON jm.material_id = m.id
     WHERE j.customer_id = $1 ${dateFilter}`,
    materialParams
  );

  const totalMaterialCost = parseFloat(materialResult.rows[0].total_material_cost) || 0;
  const totalCost = totalLaborCost + totalMaterialCost;
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    customer_id: data.id,
    customer_name: data.name,
    customer_email: data.email,
    total_jobs: parseInt(data.total_jobs) || 0,
    total_revenue: totalRevenue,
    total_paid: totalPaid,
    outstanding_balance: totalRevenue - totalPaid,
    total_labor_cost: totalLaborCost,
    total_material_cost: totalMaterialCost,
    total_cost: totalCost,
    total_hours: parseFloat(data.total_hours) || 0,
    gross_profit: grossProfit,
    profit_margin_percentage: profitMargin.toFixed(2),
    lifetime_value: totalRevenue,
    calculated_at: new Date().toISOString()
  };
}

/**
 * Get top profitable jobs
 * @param {number} limit - Number of jobs to return
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Array>} Top profitable jobs
 */
export async function getTopProfitableJobs(limit = 10, startDate = null, endDate = null) {
  let dateFilter = '';
  const params = [];

  if (startDate && endDate) {
    dateFilter = 'WHERE pr.calculated_at >= $1 AND pr.calculated_at <= $2';
    params.push(startDate, endDate);
  }

  params.push(limit);

  const result = await query(
    `SELECT
      pr.*,
      j.job_number,
      j.title as job_title,
      j.status as job_status,
      c.name as customer_name
     FROM profitability_records pr
     JOIN jobs j ON pr.job_id = j.id
     JOIN customers c ON j.customer_id = c.id
     ${dateFilter}
     ORDER BY pr.gross_profit DESC
     LIMIT $${params.length}`,
    params
  );

  return result.rows;
}

/**
 * Get least profitable jobs
 * @param {number} limit - Number of jobs to return
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Array>} Least profitable jobs
 */
export async function getLeastProfitableJobs(limit = 10, startDate = null, endDate = null) {
  let dateFilter = '';
  const params = [];

  if (startDate && endDate) {
    dateFilter = 'WHERE pr.calculated_at >= $1 AND pr.calculated_at <= $2';
    params.push(startDate, endDate);
  }

  params.push(limit);

  const result = await query(
    `SELECT
      pr.*,
      j.job_number,
      j.title as job_title,
      j.status as job_status,
      c.name as customer_name
     FROM profitability_records pr
     JOIN jobs j ON pr.job_id = j.id
     JOIN customers c ON j.customer_id = c.id
     ${dateFilter}
     ORDER BY pr.gross_profit ASC
     LIMIT $${params.length}`,
    params
  );

  return result.rows;
}

export default {
  calculateJobProfitability,
  calculatePeriodProfitability,
  calculateCustomerProfitability,
  getTopProfitableJobs,
  getLeastProfitableJobs
};

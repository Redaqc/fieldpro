/**
 * ProfitabilityRecord Model - Store calculated profitability data
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class ProfitabilityRecord {
  static async create(data) {
    const {
      job_id = null,
      invoice_id = null,
      revenue,
      labor_cost = 0,
      material_cost = 0,
      equipment_cost = 0,
      subcontractor_cost = 0,
      overhead_cost = 0,
      total_cost,
      profit,
      profit_margin,
      warnings = []
    } = data;

    // Validation
    if (!revenue && revenue !== 0) {
      throw badRequest('Revenue is required');
    }
    if (!total_cost && total_cost !== 0) {
      throw badRequest('Total cost is required');
    }
    if (!profit && profit !== 0) {
      throw badRequest('Profit is required');
    }

    const result = await query(
      `INSERT INTO profitability_records (job_id, invoice_id, revenue, labor_cost, material_cost,
       equipment_cost, subcontractor_cost, overhead_cost, total_cost, profit, profit_margin, warnings, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING *`,
      [job_id, invoice_id, revenue, labor_cost, material_cost, equipment_cost,
       subcontractor_cost, overhead_cost, total_cost, profit, profit_margin, JSON.stringify(warnings)]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM profitability_records WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Profitability record not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'job_id', 'invoice_id', 'revenue', 'labor_cost', 'material_cost',
      'equipment_cost', 'subcontractor_cost', 'overhead_cost', 'total_cost',
      'profit', 'profit_margin', 'warnings'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify warnings
        if (field === 'warnings') {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
        }
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw badRequest('No valid fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE profitability_records SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM profitability_records WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const {
      limit = 100,
      offset = 0,
      job_id = null,
      invoice_id = null,
      from_date = null,
      to_date = null
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (job_id) {
      conditions.push(`job_id = $${paramCount}`);
      values.push(job_id);
      paramCount++;
    }

    if (invoice_id) {
      conditions.push(`invoice_id = $${paramCount}`);
      values.push(invoice_id);
      paramCount++;
    }

    if (from_date) {
      conditions.push(`calculated_at >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`calculated_at <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM profitability_records ${whereClause} ORDER BY calculated_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByJob(jobId) {
    const result = await query(
      'SELECT * FROM profitability_records WHERE job_id = $1 ORDER BY calculated_at DESC LIMIT 1',
      [jobId]
    );
    return result.rows[0] || null;
  }

  static async getByInvoice(invoiceId) {
    const result = await query(
      'SELECT * FROM profitability_records WHERE invoice_id = $1 ORDER BY calculated_at DESC LIMIT 1',
      [invoiceId]
    );
    return result.rows[0] || null;
  }

  static async getStats(options = {}) {
    const { from_date = null, to_date = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (from_date) {
      conditions.push(`calculated_at >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`calculated_at <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         COUNT(*) as total_records,
         SUM(revenue) as total_revenue,
         SUM(total_cost) as total_cost,
         SUM(profit) as total_profit,
         AVG(profit_margin) as avg_profit_margin,
         SUM(labor_cost) as total_labor_cost,
         SUM(material_cost) as total_material_cost,
         SUM(equipment_cost) as total_equipment_cost
       FROM profitability_records
       ${whereClause}`,
      values
    );

    return result.rows[0];
  }

  static async getLowProfitJobs(thresholdMargin = 10, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT pr.*, j.job_number, j.title as job_title, c.name as customer_name
       FROM profitability_records pr
       LEFT JOIN jobs j ON pr.job_id = j.id
       LEFT JOIN customers c ON j.customer_id = c.id
       WHERE pr.profit_margin < $1
       ORDER BY pr.profit_margin ASC LIMIT $2 OFFSET $3`,
      [thresholdMargin, limit, offset]
    );

    return result.rows;
  }

  static async getTopProfitableJobs(options = {}) {
    const { limit = 20, offset = 0, from_date = null, to_date = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (from_date) {
      conditions.push(`pr.calculated_at >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`pr.calculated_at <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT pr.*, j.job_number, j.title as job_title, c.name as customer_name
       FROM profitability_records pr
       LEFT JOIN jobs j ON pr.job_id = j.id
       LEFT JOIN customers c ON j.customer_id = c.id
       ${whereClause}
       ORDER BY pr.profit DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }
}

export default ProfitabilityRecord;

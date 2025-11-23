/**
 * RecurringJob Model - Scheduled recurring jobs
 */
import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class RecurringJob {
  static async create(data) {
    const {
      customer_id, title, description, frequency = 'monthly', interval = 1,
      day_of_week, day_of_month, start_date, end_date, next_occurrence,
      assigned_technician_id, is_active = true, template_config = {}
    } = data;

    if (!customer_id || !title) throw badRequest('Customer and title required');

    const result = await query(
      `INSERT INTO recurring_jobs (customer_id, title, description, frequency, interval,
        day_of_week, day_of_month, start_date, end_date, next_occurrence,
        assigned_technician_id, is_active, template_config, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING *`,
      [customer_id, title, description, frequency, interval, day_of_week, day_of_month,
       start_date, end_date, next_occurrence, assigned_technician_id, is_active, template_config]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM recurring_jobs WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`RecurringJob ${id} not found`);
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = ['title', 'description', 'frequency', 'interval', 'day_of_week', 'day_of_month',
      'start_date', 'end_date', 'next_occurrence', 'assigned_technician_id', 'is_active', 'template_config'];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE recurring_jobs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM recurring_jobs WHERE id = $1', [id]);
    return true;
  }

  static async list(options = {}) {
    const { limit = 50, offset = 0, is_active, customer_id } = options;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (customer_id) {
      conditions.push(`customer_id = $${paramCount++}`);
      values.push(customer_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM recurring_jobs ${whereClause} ORDER BY next_occurrence ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );
    return result.rows;
  }

  static async getDue() {
    const result = await query(
      `SELECT * FROM recurring_jobs WHERE is_active = true AND next_occurrence <= NOW() ORDER BY next_occurrence ASC`,
      []
    );
    return result.rows;
  }
}

export default RecurringJob;

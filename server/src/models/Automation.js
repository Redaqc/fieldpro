/**
 * Automation Model
 * Complete CRUD operations for Automation entity
 * Replaces base44.entities.Automation.*
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Automation {
  static async create(data) {
    const {
      name,
      trigger_type,
      trigger_config = {},
      conditions = [],
      actions = [],
      is_active = true,
      priority = 1,
      description
    } = data;

    if (!name) throw badRequest('Automation name is required');
    if (!trigger_type) throw badRequest('Trigger type is required');

    const validTriggers = [
      'job_created', 'job_status_changed', 'job_completed',
      'invoice_created', 'invoice_paid', 'invoice_overdue',
      'time_entry_created', 'customer_created', 'schedule_changed'
    ];

    if (!validTriggers.includes(trigger_type)) {
      throw badRequest(`Invalid trigger type. Must be one of: ${validTriggers.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO automations (
        name, trigger_type, trigger_config, conditions, actions,
        is_active, priority, description, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [name, trigger_type, trigger_config, conditions, actions, is_active, priority, description]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM automations WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`Automation with ID ${id} not found`);
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = ['name', 'trigger_type', 'trigger_config', 'conditions', 'actions', 'is_active', 'priority', 'description'];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE automations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM automations WHERE id = $1', [id]);
    return true;
  }

  static async list(options = {}) {
    const { limit = 50, offset = 0, is_active, trigger_type } = options;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (trigger_type) {
      conditions.push(`trigger_type = $${paramCount++}`);
      values.push(trigger_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM automations ${whereClause} ORDER BY priority ASC, created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  static async getByTrigger(triggerType) {
    const result = await query(
      `SELECT * FROM automations WHERE trigger_type = $1 AND is_active = true ORDER BY priority ASC`,
      [triggerType]
    );
    return result.rows;
  }

  static async activate(id) {
    return await this.update(id, { is_active: true });
  }

  static async deactivate(id) {
    return await this.update(id, { is_active: false });
  }
}

export default Automation;

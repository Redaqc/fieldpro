/**
 * WorkType Model - Categorization of work types
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class WorkType {
  static async create(data) {
    const {
      name,
      description = null,
      color = '#3B82F6',
      icon = null,
      default_duration_hours = 1,
      default_rate = 0,
      is_billable = true,
      is_active = true,
      required_skills = [],
      checklist_template_id = null,
      form_template_id = null
    } = data;

    // Validation
    if (!name) {
      throw badRequest('Name is required');
    }

    const result = await query(
      `INSERT INTO work_types (name, description, color, icon, default_duration_hours,
       default_rate, is_billable, is_active, required_skills, checklist_template_id,
       form_template_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
      [name, description, color, icon, default_duration_hours, default_rate, is_billable,
       is_active, JSON.stringify(required_skills), checklist_template_id, form_template_id]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM work_types WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Work type not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'description', 'color', 'icon', 'default_duration_hours',
      'default_rate', 'is_billable', 'is_active', 'required_skills',
      'checklist_template_id', 'form_template_id'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify arrays
        if (field === 'required_skills') {
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

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE work_types SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM work_types WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, is_active = null, is_billable = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (is_billable !== null) {
      conditions.push(`is_billable = $${paramCount}`);
      values.push(is_billable);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM work_types ${whereClause} ORDER BY name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getActive() {
    const result = await query('SELECT * FROM work_types WHERE is_active = true ORDER BY name ASC', []);
    return result.rows;
  }

  static async getBySkill(skill) {
    const result = await query(
      `SELECT * FROM work_types WHERE required_skills @> $1 AND is_active = true`,
      [JSON.stringify([skill])]
    );
    return result.rows;
  }
}

export default WorkType;

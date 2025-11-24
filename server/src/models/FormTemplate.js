/**
 * FormTemplate Model - Custom form templates
 */
import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class FormTemplate {
  static async create(data) {
    const { name, description, fields = [], is_active = true, category } = data;
    if (!name) throw badRequest('Name required');

    const result = await query(
      `INSERT INTO form_templates (name, description, fields, is_active, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [name, description, fields, is_active, category]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM form_templates WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`FormTemplate ${id} not found`);
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);
    const updates = [];
    const values = [];
    let paramCount = 1;

    ['name', 'description', 'fields', 'is_active', 'category'].forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE form_templates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM form_templates WHERE id = $1', [id]);
    return true;
  }

  static async list(options = {}) {
    const { limit = 50, offset = 0, is_active, category } = options;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM form_templates ${whereClause} ORDER BY name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );
    return result.rows;
  }
}

export default FormTemplate;

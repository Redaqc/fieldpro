/**
 * CustomField Model - Custom field definitions
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class CustomField {
  static async create(data) {
    const {
      entity_type,
      field_name,
      field_label,
      field_type,
      field_options = [],
      default_value = null,
      is_required = false,
      is_searchable = false,
      validation_rules = {},
      display_order = 0,
      is_active = true,
      help_text = null
    } = data;

    // Validation
    if (!entity_type) {
      throw badRequest('Entity type is required');
    }
    if (!field_name) {
      throw badRequest('Field name is required');
    }
    if (!field_label) {
      throw badRequest('Field label is required');
    }
    if (!field_type) {
      throw badRequest('Field type is required');
    }

    const validFieldTypes = ['text', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'textarea', 'email', 'phone', 'url'];
    if (!validFieldTypes.includes(field_type)) {
      throw badRequest(`Invalid field type. Must be one of: ${validFieldTypes.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO custom_fields (entity_type, field_name, field_label, field_type, field_options,
       default_value, is_required, is_searchable, validation_rules, display_order, is_active, help_text,
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`,
      [entity_type, field_name, field_label, field_type, JSON.stringify(field_options),
       default_value, is_required, is_searchable, JSON.stringify(validation_rules),
       display_order, is_active, help_text]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM custom_fields WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Custom field not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'entity_type', 'field_name', 'field_label', 'field_type', 'field_options',
      'default_value', 'is_required', 'is_searchable', 'validation_rules',
      'display_order', 'is_active', 'help_text'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify arrays/objects
        if (field === 'field_options' || field === 'validation_rules') {
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
      `UPDATE custom_fields SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    // Delete associated custom field values
    await query('DELETE FROM custom_field_values WHERE custom_field_id = $1', [id]);
    await query('DELETE FROM custom_fields WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, entity_type = null, is_active = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(entity_type);
      paramCount++;
    }

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM custom_fields ${whereClause} ORDER BY display_order ASC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByEntityType(entityType) {
    const result = await query(
      'SELECT * FROM custom_fields WHERE entity_type = $1 AND is_active = true ORDER BY display_order ASC',
      [entityType]
    );
    return result.rows;
  }

  static async reorder(entityType, fieldIds) {
    // Update display_order for multiple fields
    for (let i = 0; i < fieldIds.length; i++) {
      await query(
        'UPDATE custom_fields SET display_order = $1, updated_at = NOW() WHERE id = $2 AND entity_type = $3',
        [i, fieldIds[i], entityType]
      );
    }
    return { success: true };
  }
}

export default CustomField;

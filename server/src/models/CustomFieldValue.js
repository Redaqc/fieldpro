/**
 * CustomFieldValue Model - Custom field values for entities
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class CustomFieldValue {
  static async create(data) {
    const {
      custom_field_id,
      entity_type,
      entity_id,
      value
    } = data;

    // Validation
    if (!custom_field_id) {
      throw badRequest('Custom field ID is required');
    }
    if (!entity_type) {
      throw badRequest('Entity type is required');
    }
    if (!entity_id) {
      throw badRequest('Entity ID is required');
    }

    // Check if value already exists for this field and entity
    const existing = await query(
      'SELECT * FROM custom_field_values WHERE custom_field_id = $1 AND entity_type = $2 AND entity_id = $3',
      [custom_field_id, entity_type, entity_id]
    );

    if (existing.rows.length > 0) {
      // Update existing value
      return await this.update(existing.rows[0].id, { value });
    }

    const result = await query(
      `INSERT INTO custom_field_values (custom_field_id, entity_type, entity_id, value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [custom_field_id, entity_type, entity_id, value]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM custom_field_values WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Custom field value not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const { value } = data;

    if (value === undefined) {
      throw badRequest('Value is required');
    }

    const result = await query(
      `UPDATE custom_field_values SET value = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [value, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM custom_field_values WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, entity_type = null, entity_id = null, custom_field_id = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(entity_type);
      paramCount++;
    }

    if (entity_id) {
      conditions.push(`entity_id = $${paramCount}`);
      values.push(entity_id);
      paramCount++;
    }

    if (custom_field_id) {
      conditions.push(`custom_field_id = $${paramCount}`);
      values.push(custom_field_id);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM custom_field_values ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByEntity(entityType, entityId) {
    const result = await query(
      `SELECT cfv.*, cf.field_name, cf.field_label, cf.field_type
       FROM custom_field_values cfv
       JOIN custom_fields cf ON cfv.custom_field_id = cf.id
       WHERE cfv.entity_type = $1 AND cfv.entity_id = $2
       ORDER BY cf.display_order ASC`,
      [entityType, entityId]
    );
    return result.rows;
  }

  static async setEntityValues(entityType, entityId, values) {
    // values is an object: { field_name: value, ... }
    const results = [];

    for (const [fieldName, value] of Object.entries(values)) {
      // Get custom field by name and entity type
      const fieldResult = await query(
        'SELECT * FROM custom_fields WHERE entity_type = $1 AND field_name = $2 AND is_active = true',
        [entityType, fieldName]
      );

      if (fieldResult.rows.length === 0) {
        console.warn(`Custom field ${fieldName} not found for entity type ${entityType}`);
        continue;
      }

      const field = fieldResult.rows[0];

      // Create or update value
      const result = await this.create({
        custom_field_id: field.id,
        entity_type: entityType,
        entity_id: entityId,
        value
      });

      results.push(result);
    }

    return results;
  }

  static async deleteByEntity(entityType, entityId) {
    await query(
      'DELETE FROM custom_field_values WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );
    return { success: true };
  }
}

export default CustomFieldValue;

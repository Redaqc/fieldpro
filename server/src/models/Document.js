/**
 * Document Model
 * Complete CRUD operations for Document entity
 * Replaces base44.entities.Document.*
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Document {
  static async create(data) {
    const {
      entity_type,
      entity_id,
      name,
      file_url,
      file_type,
      file_size,
      category = 'general',
      uploaded_by,
      description,
      metadata = {}
    } = data;

    if (!entity_type || !entity_id) throw badRequest('Entity type and ID are required');
    if (!name || !file_url) throw badRequest('Name and file URL are required');

    const result = await query(
      `INSERT INTO documents (
        entity_type, entity_id, name, file_url, file_type, file_size,
        category, uploaded_by, description, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [entity_type, entity_id, name, file_url, file_type, file_size, category, uploaded_by, description, metadata]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`Document with ID ${id} not found`);
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = ['name', 'category', 'description', 'metadata'];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM documents WHERE id = $1', [id]);
    return true;
  }

  static async getByEntity(entityType, entityId) {
    const result = await query(
      `SELECT * FROM documents WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC`,
      [entityType, entityId]
    );
    return result.rows;
  }

  static async filter(filters = {}) {
    const { entity_type, entity_id, category, file_type, search, limit = 100, offset = 0 } = filters;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount++}`);
      values.push(entity_type);
    }
    if (entity_id) {
      conditions.push(`entity_id = $${paramCount++}`);
      values.push(entity_id);
    }
    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (file_type) {
      conditions.push(`file_type = $${paramCount++}`);
      values.push(file_type);
    }
    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM documents ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }
}

export default Document;

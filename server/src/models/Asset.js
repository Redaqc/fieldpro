/**
 * Asset Model
 * Complete CRUD operations for Asset entity
 * Replaces base44.entities.Asset.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Asset {
  /**
   * Create a new asset
   */
  static async create(data) {
    const {
      name,
      asset_tag,
      category,
      model,
      manufacturer,
      serial_number,
      purchase_date,
      purchase_price,
      current_value,
      warranty_expiry,
      status = 'available',
      location,
      assigned_to,
      notes,
      custom_fields = {}
    } = data;

    if (!name) throw badRequest('Asset name is required');
    if (!asset_tag) throw badRequest('Asset tag is required');

    const validStatuses = ['available', 'in_use', 'maintenance', 'retired', 'lost'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO assets (
        name, asset_tag, category, model, manufacturer, serial_number,
        purchase_date, purchase_price, current_value, warranty_expiry,
        status, location, assigned_to, notes, custom_fields,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        name, asset_tag, category, model, manufacturer, serial_number,
        purchase_date, purchase_price, current_value, warranty_expiry,
        status, location, assigned_to, notes, custom_fields
      ]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM assets WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`Asset with ID ${id} not found`);
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = [
      'name', 'asset_tag', 'category', 'model', 'manufacturer', 'serial_number',
      'purchase_date', 'purchase_price', 'current_value', 'warranty_expiry',
      'status', 'location', 'assigned_to', 'notes', 'custom_fields'
    ];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE assets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM assets WHERE id = $1', [id]);
    return true;
  }

  static async list(options = {}) {
    const { limit = 50, offset = 0, status, assigned_to } = options;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (assigned_to) {
      conditions.push(`assigned_to = $${paramCount++}`);
      values.push(assigned_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) as total FROM assets ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM assets ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return {
      data: result.rows,
      pagination: { total, limit, offset, pages: Math.ceil(total / limit) }
    };
  }

  static async filter(filters = {}) {
    const { search, category, status, assigned_to, limit = 100, offset = 0 } = filters;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR asset_tag ILIKE $${paramCount} OR serial_number ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }
    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (assigned_to) {
      conditions.push(`assigned_to = $${paramCount++}`);
      values.push(assigned_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM assets ${whereClause} ORDER BY name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  static async assign(assetId, technicianId) {
    return await this.update(assetId, {
      assigned_to: technicianId,
      status: 'in_use'
    });
  }

  static async unassign(assetId) {
    return await this.update(assetId, {
      assigned_to: null,
      status: 'available'
    });
  }
}

export default Asset;

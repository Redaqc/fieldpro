/**
 * PriceList Model - Pricing tiers and lists
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class PriceList {
  static async create(data) {
    const {
      name,
      description = null,
      is_default = false,
      valid_from = null,
      valid_until = null,
      discount_percentage = 0,
      is_active = true,
      customer_ids = [],
      items = []
    } = data;

    // Validation
    if (!name) {
      throw badRequest('Name is required');
    }

    const result = await query(
      `INSERT INTO price_lists (name, description, is_default, valid_from, valid_until,
       discount_percentage, is_active, customer_ids, items, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [name, description, is_default, valid_from, valid_until, discount_percentage,
       is_active, JSON.stringify(customer_ids), JSON.stringify(items)]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM price_lists WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Price list not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'description', 'is_default', 'valid_from', 'valid_until',
      'discount_percentage', 'is_active', 'customer_ids', 'items'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify arrays/objects
        if (field === 'customer_ids' || field === 'items') {
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
      `UPDATE price_lists SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM price_lists WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, is_active = null, is_default = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (is_default !== null) {
      conditions.push(`is_default = $${paramCount}`);
      values.push(is_default);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM price_lists ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getDefault() {
    const result = await query('SELECT * FROM price_lists WHERE is_default = true AND is_active = true LIMIT 1', []);
    return result.rows[0] || null;
  }

  static async getByCustomer(customerId) {
    const result = await query(
      `SELECT * FROM price_lists WHERE customer_ids @> $1 AND is_active = true`,
      [JSON.stringify([customerId])]
    );
    return result.rows;
  }

  static async addItem(priceListId, item) {
    const priceList = await this.findById(priceListId);
    const items = priceList.items || [];

    const newItem = {
      id: Date.now().toString(),
      material_id: item.material_id,
      service_id: item.service_id,
      price: item.price,
      unit: item.unit || 'unit',
      minimum_quantity: item.minimum_quantity || 1
    };

    items.push(newItem);

    return await this.update(priceListId, { items });
  }

  static async removeItem(priceListId, itemId) {
    const priceList = await this.findById(priceListId);
    const items = (priceList.items || []).filter(item => item.id !== itemId);
    return await this.update(priceListId, { items });
  }
}

export default PriceList;

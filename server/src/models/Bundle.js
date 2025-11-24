/**
 * Bundle Model
 * Manages service and material bundles/packages
 */

import pool from '../database/pool.js';

class Bundle {
  /**
   * Get all bundles with filters
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM bundles WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.bundle_type) {
      query += ` AND bundle_type = $${paramCount}`;
      params.push(filters.bundle_type);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get bundle by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM bundles WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get bundle with detailed items
   */
  static async findByIdWithDetails(id) {
    const bundle = await this.findById(id);
    if (!bundle) return null;

    // Enrich items with full details
    const enrichedItems = await this.enrichBundleItems(bundle.items);

    return {
      ...bundle,
      items_detailed: enrichedItems
    };
  }

  /**
   * Enrich bundle items with full details
   */
  static async enrichBundleItems(items) {
    if (!items || items.length === 0) return [];

    const enrichedItems = [];

    for (const item of items) {
      let details = null;

      if (item.type === 'service') {
        const result = await pool.query(
          'SELECT id, name, description, price FROM work_types WHERE id = $1',
          [item.id]
        );
        details = result.rows[0];
      } else if (item.type === 'material') {
        const result = await pool.query(
          'SELECT id, name, description, unit_price as price, unit FROM materials WHERE id = $1',
          [item.id]
        );
        details = result.rows[0];
      }

      enrichedItems.push({
        ...item,
        details
      });
    }

    return enrichedItems;
  }

  /**
   * Create new bundle
   */
  static async create(data) {
    const {
      name,
      description,
      bundle_type,
      items,
      base_price,
      discounted_price,
      is_active
    } = data;

    const result = await pool.query(
      `INSERT INTO bundles
       (name, description, bundle_type, items, base_price, discounted_price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        description,
        bundle_type || 'mixed',
        items || [],
        base_price,
        discounted_price,
        is_active !== false
      ]
    );

    return result.rows[0];
  }

  /**
   * Update bundle
   */
  static async update(id, data) {
    const {
      name,
      description,
      bundle_type,
      items,
      base_price,
      discounted_price,
      is_active
    } = data;

    const result = await pool.query(
      `UPDATE bundles
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           bundle_type = COALESCE($3, bundle_type),
           items = COALESCE($4, items),
           base_price = COALESCE($5, base_price),
           discounted_price = COALESCE($6, discounted_price),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, description, bundle_type, items, base_price, discounted_price, is_active, id]
    );

    return result.rows[0];
  }

  /**
   * Add item to bundle
   */
  static async addItem(id, item) {
    const bundle = await this.findById(id);
    if (!bundle) {
      throw new Error('Bundle not found');
    }

    const items = bundle.items || [];
    items.push(item);

    // Recalculate base price
    const basePrice = await this.calculateBasePrice(items);

    return await this.update(id, { items, base_price: basePrice });
  }

  /**
   * Remove item from bundle
   */
  static async removeItem(id, itemIndex) {
    const bundle = await this.findById(id);
    if (!bundle) {
      throw new Error('Bundle not found');
    }

    const items = bundle.items || [];
    items.splice(itemIndex, 1);

    // Recalculate base price
    const basePrice = await this.calculateBasePrice(items);

    return await this.update(id, { items, base_price: basePrice });
  }

  /**
   * Update item quantity
   */
  static async updateItemQuantity(id, itemIndex, quantity) {
    const bundle = await this.findById(id);
    if (!bundle) {
      throw new Error('Bundle not found');
    }

    const items = bundle.items || [];
    if (items[itemIndex]) {
      items[itemIndex].quantity = quantity;
    }

    // Recalculate base price
    const basePrice = await this.calculateBasePrice(items);

    return await this.update(id, { items, base_price: basePrice });
  }

  /**
   * Calculate base price from items
   */
  static async calculateBasePrice(items) {
    let total = 0;

    for (const item of items) {
      let price = 0;

      if (item.type === 'service') {
        const result = await pool.query(
          'SELECT price FROM work_types WHERE id = $1',
          [item.id]
        );
        if (result.rows[0]) {
          price = parseFloat(result.rows[0].price) || 0;
        }
      } else if (item.type === 'material') {
        const result = await pool.query(
          'SELECT unit_price FROM materials WHERE id = $1',
          [item.id]
        );
        if (result.rows[0]) {
          price = parseFloat(result.rows[0].unit_price) || 0;
        }
      }

      total += price * (item.quantity || 1);
    }

    return total;
  }

  /**
   * Calculate discount percentage
   */
  static calculateDiscountPercentage(basePrice, discountedPrice) {
    if (!basePrice || basePrice === 0) return 0;
    return ((basePrice - discountedPrice) / basePrice) * 100;
  }

  /**
   * Apply discount percentage
   */
  static async applyDiscountPercentage(id, discountPercentage) {
    const bundle = await this.findById(id);
    if (!bundle) {
      throw new Error('Bundle not found');
    }

    const basePrice = parseFloat(bundle.base_price) || 0;
    const discountedPrice = basePrice * (1 - discountPercentage / 100);

    return await this.update(id, { discounted_price: discountedPrice });
  }

  /**
   * Toggle active status
   */
  static async toggleActive(id) {
    const result = await pool.query(
      `UPDATE bundles
       SET is_active = NOT is_active,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete bundle
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM bundles WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get bundle statistics
   */
  static async getStats() {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_bundles,
         COUNT(*) FILTER (WHERE is_active = true) as active_bundles,
         COUNT(*) FILTER (WHERE bundle_type = 'service') as service_bundles,
         COUNT(*) FILTER (WHERE bundle_type = 'material') as material_bundles,
         COUNT(*) FILTER (WHERE bundle_type = 'mixed') as mixed_bundles,
         AVG(base_price) as avg_base_price,
         AVG(discounted_price) as avg_discounted_price
       FROM bundles`
    );
    return result.rows[0];
  }
}

export default Bundle;

/**
 * Material Model
 * Complete CRUD operations for Material entity
 * Replaces base44.entities.Material.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Material {
  /**
   * Create a new material
   * @param {Object} data - Material data
   * @returns {Promise<Object>} Created material
   */
  static async create(data) {
    const {
      name,
      sku,
      description,
      category,
      unit_price,
      cost_price,
      quantity_in_stock = 0,
      minimum_stock_level = 0,
      unit = 'piece',
      supplier_name,
      supplier_contact,
      is_active = true,
      notes,
      custom_fields = {}
    } = data;

    // Validate required fields
    if (!name) {
      throw badRequest('Material name is required');
    }
    if (!sku) {
      throw badRequest('SKU is required');
    }
    if (unit_price === undefined) {
      throw badRequest('Unit price is required');
    }

    const result = await query(
      `INSERT INTO materials (
        name, sku, description, category, unit_price, cost_price,
        quantity_in_stock, minimum_stock_level, unit,
        supplier_name, supplier_contact, is_active, notes, custom_fields,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        name, sku, description, category, unit_price, cost_price,
        quantity_in_stock, minimum_stock_level, unit,
        supplier_name, supplier_contact, is_active, notes, custom_fields
      ]
    );

    return result.rows[0];
  }

  /**
   * Get material by ID
   * @param {string} id - Material UUID
   * @returns {Promise<Object>} Material record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM materials WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Material with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Get material by SKU
   * @param {string} sku - Material SKU
   * @returns {Promise<Object>} Material record
   */
  static async findBySku(sku) {
    const result = await query(
      'SELECT * FROM materials WHERE sku = $1',
      [sku]
    );

    if (result.rows.length === 0) {
      throw notFound(`Material with SKU ${sku} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update material
   * @param {string} id - Material UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated material
   */
  static async update(id, data) {
    // First check if material exists
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      name: 'name',
      sku: 'sku',
      description: 'description',
      category: 'category',
      unit_price: 'unit_price',
      cost_price: 'cost_price',
      quantity_in_stock: 'quantity_in_stock',
      minimum_stock_level: 'minimum_stock_level',
      unit: 'unit',
      supplier_name: 'supplier_name',
      supplier_contact: 'supplier_contact',
      is_active: 'is_active',
      notes: 'notes',
      custom_fields: 'custom_fields'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE materials
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete material
   * @param {string} id - Material UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    await this.findById(id);

    await query('DELETE FROM materials WHERE id = $1', [id]);
    return true;
  }

  /**
   * List materials with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Materials and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'ASC',
      is_active,
      category
    } = options;

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

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM materials ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM materials
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return {
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Filter materials with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered materials
   */
  static async filter(filters = {}) {
    const {
      search,
      category,
      is_active,
      low_stock,
      min_price,
      max_price,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Search in name, sku, description
    if (search) {
      conditions.push(`(
        name ILIKE $${paramCount} OR
        sku ILIKE $${paramCount} OR
        description ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filter by category
    if (category) {
      conditions.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    // Low stock filter
    if (low_stock) {
      conditions.push(`quantity_in_stock <= minimum_stock_level`);
    }

    // Price filters
    if (min_price !== undefined) {
      conditions.push(`unit_price >= $${paramCount}`);
      values.push(min_price);
      paramCount++;
    }

    if (max_price !== undefined) {
      conditions.push(`unit_price <= $${paramCount}`);
      values.push(max_price);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM materials
       ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Adjust stock quantity
   * @param {string} id - Material UUID
   * @param {number} quantity - Quantity to add (positive) or remove (negative)
   * @param {string} reason - Reason for adjustment
   * @returns {Promise<Object>} Updated material
   */
  static async adjustStock(id, quantity, reason = 'manual adjustment') {
    const material = await this.findById(id);
    const newQuantity = parseFloat(material.quantity_in_stock) + quantity;

    if (newQuantity < 0) {
      throw badRequest('Stock quantity cannot be negative');
    }

    return await this.update(id, { quantity_in_stock: newQuantity });
  }

  /**
   * Get low stock materials
   * @returns {Promise<Array>} Materials with low stock
   */
  static async getLowStock() {
    const result = await query(
      `SELECT * FROM materials
       WHERE quantity_in_stock <= minimum_stock_level
         AND is_active = true
       ORDER BY (minimum_stock_level - quantity_in_stock) DESC`,
      []
    );

    return result.rows;
  }

  /**
   * Get materials by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Materials in category
   */
  static async getByCategory(category) {
    const result = await query(
      `SELECT * FROM materials
       WHERE category = $1 AND is_active = true
       ORDER BY name ASC`,
      [category]
    );

    return result.rows;
  }

  /**
   * Calculate profit margin
   * @param {string} id - Material UUID
   * @returns {Promise<Object>} Profit margin data
   */
  static async calculateProfitMargin(id) {
    const material = await this.findById(id);
    const unitPrice = parseFloat(material.unit_price) || 0;
    const costPrice = parseFloat(material.cost_price) || 0;
    const profit = unitPrice - costPrice;
    const profitMargin = costPrice > 0 ? (profit / costPrice) * 100 : 0;

    return {
      unit_price: unitPrice,
      cost_price: costPrice,
      profit_per_unit: profit,
      profit_margin_percentage: profitMargin.toFixed(2)
    };
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} List of unique categories
   */
  static async getCategories() {
    const result = await query(
      `SELECT DISTINCT category
       FROM materials
       WHERE category IS NOT NULL
       ORDER BY category ASC`,
      []
    );

    return result.rows.map(row => row.category);
  }
}

export default Material;

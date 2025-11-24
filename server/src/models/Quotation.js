/**
 * Quotation Model
 * Complete CRUD operations for Quotation entity
 * Replaces base44.entities.Quotation.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Quotation {
  /**
   * Create a new quotation
   * @param {Object} data - Quotation data
   * @returns {Promise<Object>} Created quotation with line items
   */
  static async create(data) {
    const {
      quote_number,
      customer_id,
      issue_date = new Date().toISOString(),
      valid_until,
      status = 'draft',
      subtotal = 0,
      tax_amount = 0,
      discount_amount = 0,
      total_amount = 0,
      notes,
      terms,
      custom_fields = {},
      line_items = []
    } = data;

    // Validate required fields
    if (!customer_id) {
      throw badRequest('Customer ID is required');
    }
    if (!quote_number) {
      throw badRequest('Quote number is required');
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Use transaction to create quotation and line items
    const result = await transaction(async (client) => {
      // Create quotation
      const quotationResult = await client.query(
        `INSERT INTO quotations (
          quote_number, customer_id, issue_date, valid_until, status,
          subtotal, tax_amount, discount_amount, total_amount,
          notes, terms, custom_fields, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          quote_number, customer_id, issue_date, valid_until, status,
          subtotal, tax_amount, discount_amount, total_amount,
          notes, terms, custom_fields
        ]
      );

      const quotation = quotationResult.rows[0];

      // Create line items if provided
      const createdLineItems = [];
      for (const item of line_items) {
        const lineItemResult = await client.query(
          `INSERT INTO quotation_line_items (
            quotation_id, item_type, item_id, description, quantity,
            unit_price, total_price, tax_rate, discount_amount
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            quotation.id,
            item.item_type || 'custom',
            item.item_id || null,
            item.description,
            item.quantity || 1,
            item.unit_price,
            item.total_price || (item.quantity || 1) * item.unit_price,
            item.tax_rate || 0,
            item.discount_amount || 0
          ]
        );
        createdLineItems.push(lineItemResult.rows[0]);
      }

      return { ...quotation, line_items: createdLineItems };
    });

    return result;
  }

  /**
   * Get quotation by ID
   * @param {string} id - Quotation UUID
   * @returns {Promise<Object>} Quotation record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM quotations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Quotation with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update quotation
   * @param {string} id - Quotation UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated quotation
   */
  static async update(id, data) {
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      quote_number: 'quote_number',
      customer_id: 'customer_id',
      issue_date: 'issue_date',
      valid_until: 'valid_until',
      status: 'status',
      subtotal: 'subtotal',
      tax_amount: 'tax_amount',
      discount_amount: 'discount_amount',
      total_amount: 'total_amount',
      notes: 'notes',
      terms: 'terms',
      custom_fields: 'custom_fields',
      sent_at: 'sent_at',
      viewed_at: 'viewed_at',
      accepted_at: 'accepted_at',
      declined_at: 'declined_at'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Validate status if being updated
    if (data.status) {
      const validStatuses = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'];
      if (!validStatuses.includes(data.status)) {
        throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE quotations
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete quotation
   * @param {string} id - Quotation UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const quotation = await this.findById(id);

    // Don't allow deletion of accepted quotations
    if (quotation.status === 'accepted') {
      throw badRequest('Cannot delete accepted quotation');
    }

    await transaction(async (client) => {
      // Delete line items
      await client.query('DELETE FROM quotation_line_items WHERE quotation_id = $1', [id]);

      // Delete quotation
      await client.query('DELETE FROM quotations WHERE id = $1', [id]);
    });

    return true;
  }

  /**
   * List quotations with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Quotations and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      status,
      customer_id
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (customer_id) {
      conditions.push(`customer_id = $${paramCount++}`);
      values.push(customer_id);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM quotations ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await query(
      `SELECT
        q.*,
        c.name as customer_name,
        c.email as customer_email
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
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
   * Filter quotations
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered quotations
   */
  static async filter(filters = {}) {
    const {
      search,
      status,
      customer_id,
      issue_date_after,
      issue_date_before,
      valid_until_after,
      valid_until_before,
      min_amount,
      max_amount,
      is_expired,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        q.quote_number ILIKE $${paramCount} OR
        q.notes ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(`q.status = ANY($${paramCount})`);
        values.push(status);
      } else {
        conditions.push(`q.status = $${paramCount}`);
        values.push(status);
      }
      paramCount++;
    }

    if (customer_id) {
      conditions.push(`q.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    if (issue_date_after) {
      conditions.push(`q.issue_date >= $${paramCount}`);
      values.push(issue_date_after);
      paramCount++;
    }

    if (issue_date_before) {
      conditions.push(`q.issue_date <= $${paramCount}`);
      values.push(issue_date_before);
      paramCount++;
    }

    if (valid_until_after) {
      conditions.push(`q.valid_until >= $${paramCount}`);
      values.push(valid_until_after);
      paramCount++;
    }

    if (valid_until_before) {
      conditions.push(`q.valid_until <= $${paramCount}`);
      values.push(valid_until_before);
      paramCount++;
    }

    if (min_amount !== undefined) {
      conditions.push(`q.total_amount >= $${paramCount}`);
      values.push(min_amount);
      paramCount++;
    }

    if (max_amount !== undefined) {
      conditions.push(`q.total_amount <= $${paramCount}`);
      values.push(max_amount);
      paramCount++;
    }

    if (is_expired) {
      conditions.push(`q.valid_until < CURRENT_DATE AND q.status NOT IN ('accepted', 'declined')`);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT
        q.*,
        c.name as customer_name,
        c.email as customer_email
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       ${whereClause}
       ORDER BY q.issue_date DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Get quotation with all related data
   * @param {string} id - Quotation UUID
   * @returns {Promise<Object>} Quotation with relations
   */
  static async findWithRelations(id) {
    const quotation = await this.findById(id);

    // Get customer
    const customer = await query(
      'SELECT * FROM customers WHERE id = $1',
      [quotation.customer_id]
    );

    // Get line items
    const lineItems = await query(
      `SELECT * FROM quotation_line_items
       WHERE quotation_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return {
      ...quotation,
      customer: customer.rows[0] || null,
      line_items: lineItems.rows
    };
  }

  /**
   * Add line item to quotation
   * @param {string} quotationId - Quotation UUID
   * @param {Object} itemData - Line item data
   * @returns {Promise<Object>} Created line item
   */
  static async addLineItem(quotationId, itemData) {
    const {
      item_type = 'custom',
      item_id,
      description,
      quantity = 1,
      unit_price,
      tax_rate = 0,
      discount_amount = 0
    } = itemData;

    const total_price = (quantity * unit_price) - discount_amount;

    const result = await query(
      `INSERT INTO quotation_line_items (
        quotation_id, item_type, item_id, description, quantity,
        unit_price, total_price, tax_rate, discount_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [quotationId, item_type, item_id, description, quantity, unit_price, total_price, tax_rate, discount_amount]
    );

    // Recalculate quotation totals
    await this.recalculateTotals(quotationId);

    return result.rows[0];
  }

  /**
   * Recalculate quotation totals from line items
   * @param {string} quotationId - Quotation UUID
   * @returns {Promise<Object>} Updated quotation
   */
  static async recalculateTotals(quotationId) {
    const lineItems = await query(
      'SELECT * FROM quotation_line_items WHERE quotation_id = $1',
      [quotationId]
    );

    let subtotal = 0;
    let tax_amount = 0;

    lineItems.rows.forEach(item => {
      subtotal += parseFloat(item.total_price);
      tax_amount += parseFloat(item.total_price) * (parseFloat(item.tax_rate) / 100);
    });

    const total_amount = subtotal + tax_amount;

    return await this.update(quotationId, {
      subtotal,
      tax_amount,
      total_amount
    });
  }

  /**
   * Mark quotation as sent
   * @param {string} id - Quotation UUID
   * @returns {Promise<Object>} Updated quotation
   */
  static async markAsSent(id) {
    return await this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }

  /**
   * Accept quotation
   * @param {string} id - Quotation UUID
   * @returns {Promise<Object>} Updated quotation
   */
  static async accept(id) {
    return await this.update(id, {
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });
  }

  /**
   * Decline quotation
   * @param {string} id - Quotation UUID
   * @returns {Promise<Object>} Updated quotation
   */
  static async decline(id) {
    return await this.update(id, {
      status: 'declined',
      declined_at: new Date().toISOString()
    });
  }

  /**
   * Convert quotation to invoice
   * @param {string} id - Quotation UUID
   * @returns {Promise<Object>} Created invoice data
   */
  static async convertToInvoice(id) {
    const quotation = await this.findWithRelations(id);

    if (quotation.status !== 'accepted') {
      throw badRequest('Only accepted quotations can be converted to invoices');
    }

    // Return the data needed to create an invoice
    // The actual invoice creation should be done through the Invoice model
    return {
      customer_id: quotation.customer_id,
      subtotal: quotation.subtotal,
      tax_amount: quotation.tax_amount,
      discount_amount: quotation.discount_amount,
      total_amount: quotation.total_amount,
      notes: quotation.notes,
      terms: quotation.terms,
      line_items: quotation.line_items.map(item => ({
        item_type: item.item_type,
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: item.tax_rate,
        discount_amount: item.discount_amount
      }))
    };
  }

  /**
   * Get expired quotations
   * @returns {Promise<Array>} Expired quotations
   */
  static async getExpired() {
    const result = await query(
      `SELECT
        q.*,
        c.name as customer_name,
        c.email as customer_email
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.valid_until < CURRENT_DATE
         AND q.status NOT IN ('accepted', 'declined', 'expired')
       ORDER BY q.valid_until ASC`,
      []
    );

    return result.rows;
  }
}

export default Quotation;

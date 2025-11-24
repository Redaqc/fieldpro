/**
 * Invoice Model
 * Complete CRUD operations for Invoice entity
 * Replaces base44.entities.Invoice.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Invoice {
  /**
   * Create a new invoice
   * @param {Object} data - Invoice data
   * @returns {Promise<Object>} Created invoice with line items
   */
  static async create(data) {
    const {
      invoice_number,
      customer_id,
      job_id,
      issue_date = new Date().toISOString(),
      due_date,
      status = 'draft',
      subtotal = 0,
      tax_amount = 0,
      discount_amount = 0,
      total_amount = 0,
      notes,
      terms,
      payment_instructions,
      custom_fields = {},
      line_items = []
    } = data;

    // Validate required fields
    if (!customer_id) {
      throw badRequest('Customer ID is required');
    }
    if (!invoice_number) {
      throw badRequest('Invoice number is required');
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Use transaction to create invoice and line items
    const result = await transaction(async (client) => {
      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number, customer_id, job_id, issue_date, due_date, status,
          subtotal, tax_amount, discount_amount, total_amount,
          notes, terms, payment_instructions, custom_fields,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *`,
        [
          invoice_number, customer_id, job_id, issue_date, due_date, status,
          subtotal, tax_amount, discount_amount, total_amount,
          notes, terms, payment_instructions, custom_fields
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Create line items if provided
      const createdLineItems = [];
      for (const item of line_items) {
        const lineItemResult = await client.query(
          `INSERT INTO invoice_line_items (
            invoice_id, item_type, item_id, description, quantity,
            unit_price, total_price, tax_rate, discount_amount
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            invoice.id,
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

      return { ...invoice, line_items: createdLineItems };
    });

    return result;
  }

  /**
   * Get invoice by ID
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Invoice record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM invoices WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Invoice with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update invoice
   * @param {string} id - Invoice UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated invoice
   */
  static async update(id, data) {
    // First check if invoice exists
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      invoice_number: 'invoice_number',
      customer_id: 'customer_id',
      job_id: 'job_id',
      issue_date: 'issue_date',
      due_date: 'due_date',
      status: 'status',
      subtotal: 'subtotal',
      tax_amount: 'tax_amount',
      discount_amount: 'discount_amount',
      total_amount: 'total_amount',
      paid_amount: 'paid_amount',
      notes: 'notes',
      terms: 'terms',
      payment_instructions: 'payment_instructions',
      custom_fields: 'custom_fields',
      sent_at: 'sent_at',
      viewed_at: 'viewed_at',
      paid_at: 'paid_at'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Validate status if being updated
    if (data.status) {
      const validStatuses = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(data.status)) {
        throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE invoices
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete invoice
   * @param {string} id - Invoice UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const invoice = await this.findById(id);

    // Don't allow deletion of paid invoices
    if (invoice.status === 'paid' || invoice.status === 'partial') {
      throw badRequest('Cannot delete invoice with payments. Void instead.');
    }

    await transaction(async (client) => {
      // Delete line items
      await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);

      // Delete invoice
      await client.query('DELETE FROM invoices WHERE id = $1', [id]);
    });

    return true;
  }

  /**
   * List invoices with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Invoices and metadata
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

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM invoices ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT
        i.*,
        c.name as customer_name,
        c.email as customer_email
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
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
   * Filter invoices with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered invoices
   */
  static async filter(filters = {}) {
    const {
      search,
      status,
      customer_id,
      job_id,
      issue_date_after,
      issue_date_before,
      due_date_after,
      due_date_before,
      min_amount,
      max_amount,
      is_overdue,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Search in invoice_number, notes
    if (search) {
      conditions.push(`(
        i.invoice_number ILIKE $${paramCount} OR
        i.notes ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filter by status
    if (status) {
      if (Array.isArray(status)) {
        conditions.push(`i.status = ANY($${paramCount})`);
        values.push(status);
      } else {
        conditions.push(`i.status = $${paramCount}`);
        values.push(status);
      }
      paramCount++;
    }

    // Filter by customer
    if (customer_id) {
      conditions.push(`i.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    // Filter by job
    if (job_id) {
      conditions.push(`i.job_id = $${paramCount}`);
      values.push(job_id);
      paramCount++;
    }

    // Date filters
    if (issue_date_after) {
      conditions.push(`i.issue_date >= $${paramCount}`);
      values.push(issue_date_after);
      paramCount++;
    }

    if (issue_date_before) {
      conditions.push(`i.issue_date <= $${paramCount}`);
      values.push(issue_date_before);
      paramCount++;
    }

    if (due_date_after) {
      conditions.push(`i.due_date >= $${paramCount}`);
      values.push(due_date_after);
      paramCount++;
    }

    if (due_date_before) {
      conditions.push(`i.due_date <= $${paramCount}`);
      values.push(due_date_before);
      paramCount++;
    }

    // Amount filters
    if (min_amount !== undefined) {
      conditions.push(`i.total_amount >= $${paramCount}`);
      values.push(min_amount);
      paramCount++;
    }

    if (max_amount !== undefined) {
      conditions.push(`i.total_amount <= $${paramCount}`);
      values.push(max_amount);
      paramCount++;
    }

    // Overdue filter
    if (is_overdue) {
      conditions.push(`i.due_date < CURRENT_DATE AND i.status NOT IN ('paid', 'cancelled')`);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT
        i.*,
        c.name as customer_name,
        c.email as customer_email
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ${whereClause}
       ORDER BY i.issue_date DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Get invoice with all related data
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Invoice with relations
   */
  static async findWithRelations(id) {
    const invoice = await this.findById(id);

    // Get customer
    const customer = await query(
      'SELECT * FROM customers WHERE id = $1',
      [invoice.customer_id]
    );

    // Get job if exists
    let job = null;
    if (invoice.job_id) {
      const jobResult = await query(
        'SELECT * FROM jobs WHERE id = $1',
        [invoice.job_id]
      );
      job = jobResult.rows[0] || null;
    }

    // Get line items
    const lineItems = await query(
      `SELECT * FROM invoice_line_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    // Get payments
    const payments = await query(
      `SELECT * FROM payments
       WHERE invoice_id = $1
       ORDER BY payment_date DESC`,
      [id]
    );

    return {
      ...invoice,
      customer: customer.rows[0] || null,
      job,
      line_items: lineItems.rows,
      payments: payments.rows
    };
  }

  /**
   * Add line item to invoice
   * @param {string} invoiceId - Invoice UUID
   * @param {Object} itemData - Line item data
   * @returns {Promise<Object>} Created line item
   */
  static async addLineItem(invoiceId, itemData) {
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
      `INSERT INTO invoice_line_items (
        invoice_id, item_type, item_id, description, quantity,
        unit_price, total_price, tax_rate, discount_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [invoiceId, item_type, item_id, description, quantity, unit_price, total_price, tax_rate, discount_amount]
    );

    // Recalculate invoice totals
    await this.recalculateTotals(invoiceId);

    return result.rows[0];
  }

  /**
   * Recalculate invoice totals from line items
   * @param {string} invoiceId - Invoice UUID
   * @returns {Promise<Object>} Updated invoice
   */
  static async recalculateTotals(invoiceId) {
    const lineItems = await query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1',
      [invoiceId]
    );

    let subtotal = 0;
    let tax_amount = 0;

    lineItems.rows.forEach(item => {
      subtotal += parseFloat(item.total_price);
      tax_amount += parseFloat(item.total_price) * (parseFloat(item.tax_rate) / 100);
    });

    const total_amount = subtotal + tax_amount;

    return await this.update(invoiceId, {
      subtotal,
      tax_amount,
      total_amount
    });
  }

  /**
   * Mark invoice as sent
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Updated invoice
   */
  static async markAsSent(id) {
    return await this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }

  /**
   * Mark invoice as paid
   * @param {string} id - Invoice UUID
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>} Updated invoice
   */
  static async markAsPaid(id, amount) {
    const invoice = await this.findById(id);
    const newPaidAmount = (parseFloat(invoice.paid_amount) || 0) + amount;
    const totalAmount = parseFloat(invoice.total_amount);

    const updates = {
      paid_amount: newPaidAmount
    };

    if (newPaidAmount >= totalAmount) {
      updates.status = 'paid';
      updates.paid_at = new Date().toISOString();
    } else if (newPaidAmount > 0) {
      updates.status = 'partial';
    }

    return await this.update(id, updates);
  }

  /**
   * Get overdue invoices
   * @returns {Promise<Array>} Overdue invoices
   */
  static async getOverdue() {
    const result = await query(
      `SELECT
        i.*,
        c.name as customer_name,
        c.email as customer_email
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.due_date < CURRENT_DATE
         AND i.status NOT IN ('paid', 'cancelled')
       ORDER BY i.due_date ASC`,
      []
    );

    return result.rows;
  }

  /**
   * Void invoice
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Voided invoice
   */
  static async void(id) {
    return await this.update(id, { status: 'cancelled' });
  }
}

export default Invoice;

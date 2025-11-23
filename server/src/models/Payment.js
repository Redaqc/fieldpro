/**
 * Payment Model
 * Complete CRUD operations for Payment entity
 * Replaces base44.entities.Payment.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Payment {
  /**
   * Create a new payment
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Created payment
   */
  static async create(data) {
    const {
      invoice_id,
      customer_id,
      amount,
      payment_date = new Date().toISOString(),
      payment_method = 'cash',
      transaction_id,
      reference_number,
      notes,
      custom_fields = {}
    } = data;

    // Validate required fields
    if (!invoice_id) {
      throw badRequest('Invoice ID is required');
    }
    if (!customer_id) {
      throw badRequest('Customer ID is required');
    }
    if (!amount || amount <= 0) {
      throw badRequest('Payment amount must be greater than 0');
    }

    // Validate payment method
    const validMethods = ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other'];
    if (!validMethods.includes(payment_method)) {
      throw badRequest(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
    }

    // Use transaction to create payment and update invoice
    const result = await transaction(async (client) => {
      // Create payment
      const paymentResult = await client.query(
        `INSERT INTO payments (
          invoice_id, customer_id, amount, payment_date, payment_method,
          transaction_id, reference_number, notes, custom_fields,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          invoice_id, customer_id, amount, payment_date, payment_method,
          transaction_id, reference_number, notes, custom_fields
        ]
      );

      const payment = paymentResult.rows[0];

      // Update invoice paid amount
      await client.query(
        `UPDATE invoices
         SET paid_amount = COALESCE(paid_amount, 0) + $1,
             status = CASE
               WHEN COALESCE(paid_amount, 0) + $1 >= total_amount THEN 'paid'
               WHEN COALESCE(paid_amount, 0) + $1 > 0 THEN 'partial'
               ELSE status
             END,
             paid_at = CASE
               WHEN COALESCE(paid_amount, 0) + $1 >= total_amount THEN NOW()
               ELSE paid_at
             END,
             updated_at = NOW()
         WHERE id = $2`,
        [amount, invoice_id]
      );

      return payment;
    });

    return result;
  }

  /**
   * Get payment by ID
   * @param {string} id - Payment UUID
   * @returns {Promise<Object>} Payment record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Payment with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update payment
   * @param {string} id - Payment UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated payment
   */
  static async update(id, data) {
    // First check if payment exists
    const payment = await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      payment_date: 'payment_date',
      payment_method: 'payment_method',
      transaction_id: 'transaction_id',
      reference_number: 'reference_number',
      notes: 'notes',
      custom_fields: 'custom_fields'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Validate payment method if being updated
    if (data.payment_method) {
      const validMethods = ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other'];
      if (!validMethods.includes(data.payment_method)) {
        throw badRequest(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
      }
    }

    // Don't allow changing amount, invoice_id, or customer_id after creation
    if (data.amount || data.invoice_id || data.customer_id) {
      throw badRequest('Cannot change amount, invoice, or customer after payment creation');
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE payments
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete payment (refund)
   * @param {string} id - Payment UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const payment = await this.findById(id);

    // Use transaction to delete payment and update invoice
    await transaction(async (client) => {
      // Update invoice paid amount
      await client.query(
        `UPDATE invoices
         SET paid_amount = COALESCE(paid_amount, 0) - $1,
             status = CASE
               WHEN COALESCE(paid_amount, 0) - $1 <= 0 THEN 'sent'
               WHEN COALESCE(paid_amount, 0) - $1 < total_amount THEN 'partial'
               ELSE status
             END,
             paid_at = CASE
               WHEN COALESCE(paid_amount, 0) - $1 < total_amount THEN NULL
               ELSE paid_at
             END,
             updated_at = NOW()
         WHERE id = $2`,
        [payment.amount, payment.invoice_id]
      );

      // Delete payment
      await client.query('DELETE FROM payments WHERE id = $1', [id]);
    });

    return true;
  }

  /**
   * List payments with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Payments and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'payment_date',
      sortOrder = 'DESC',
      invoice_id,
      customer_id,
      payment_method
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (invoice_id) {
      conditions.push(`invoice_id = $${paramCount++}`);
      values.push(invoice_id);
    }

    if (customer_id) {
      conditions.push(`customer_id = $${paramCount++}`);
      values.push(customer_id);
    }

    if (payment_method) {
      conditions.push(`payment_method = $${paramCount++}`);
      values.push(payment_method);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM payments ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT
        p.*,
        c.name as customer_name,
        i.invoice_number,
        i.total_amount as invoice_total
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN invoices i ON p.invoice_id = i.id
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
   * Filter payments with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered payments
   */
  static async filter(filters = {}) {
    const {
      customer_id,
      invoice_id,
      payment_method,
      payment_date_after,
      payment_date_before,
      min_amount,
      max_amount,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Filter by customer
    if (customer_id) {
      conditions.push(`p.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    // Filter by invoice
    if (invoice_id) {
      conditions.push(`p.invoice_id = $${paramCount}`);
      values.push(invoice_id);
      paramCount++;
    }

    // Filter by payment method
    if (payment_method) {
      if (Array.isArray(payment_method)) {
        conditions.push(`p.payment_method = ANY($${paramCount})`);
        values.push(payment_method);
      } else {
        conditions.push(`p.payment_method = $${paramCount}`);
        values.push(payment_method);
      }
      paramCount++;
    }

    // Date filters
    if (payment_date_after) {
      conditions.push(`p.payment_date >= $${paramCount}`);
      values.push(payment_date_after);
      paramCount++;
    }

    if (payment_date_before) {
      conditions.push(`p.payment_date <= $${paramCount}`);
      values.push(payment_date_before);
      paramCount++;
    }

    // Amount filters
    if (min_amount !== undefined) {
      conditions.push(`p.amount >= $${paramCount}`);
      values.push(min_amount);
      paramCount++;
    }

    if (max_amount !== undefined) {
      conditions.push(`p.amount <= $${paramCount}`);
      values.push(max_amount);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT
        p.*,
        c.name as customer_name,
        i.invoice_number,
        i.total_amount as invoice_total
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN invoices i ON p.invoice_id = i.id
       ${whereClause}
       ORDER BY p.payment_date DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Get payments for invoice
   * @param {string} invoiceId - Invoice UUID
   * @returns {Promise<Array>} Payments for invoice
   */
  static async getByInvoice(invoiceId) {
    const result = await query(
      `SELECT * FROM payments
       WHERE invoice_id = $1
       ORDER BY payment_date DESC`,
      [invoiceId]
    );

    return result.rows;
  }

  /**
   * Get total payments for date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Payment totals
   */
  static async getTotalsForDateRange(startDate, endDate) {
    const result = await query(
      `SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        payment_method,
        COUNT(*) as count_by_method
       FROM payments
       WHERE payment_date >= $1 AND payment_date <= $2
       GROUP BY payment_method`,
      [startDate, endDate]
    );

    const overallTotal = await query(
      `SELECT
        COUNT(*) as total_count,
        SUM(amount) as total_sum
       FROM payments
       WHERE payment_date >= $1 AND payment_date <= $2`,
      [startDate, endDate]
    );

    return {
      total_count: parseInt(overallTotal.rows[0].total_count) || 0,
      total_amount: parseFloat(overallTotal.rows[0].total_sum) || 0,
      by_method: result.rows
    };
  }

  /**
   * Get recent payments
   * @param {number} limit - Number of payments to return
   * @returns {Promise<Array>} Recent payments
   */
  static async getRecent(limit = 10) {
    const result = await query(
      `SELECT
        p.*,
        c.name as customer_name,
        i.invoice_number
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN invoices i ON p.invoice_id = i.id
       ORDER BY p.payment_date DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

export default Payment;

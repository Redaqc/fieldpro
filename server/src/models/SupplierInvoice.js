/**
 * SupplierInvoice Model - Track supplier/vendor invoices
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class SupplierInvoice {
  static async create(data) {
    const {
      supplier_name,
      invoice_number = null,
      invoice_date,
      due_date = null,
      amount,
      status = 'pending',
      category = null,
      notes = null
    } = data;

    // Validation
    if (!supplier_name) {
      throw badRequest('Supplier name is required');
    }
    if (!invoice_date) {
      throw badRequest('Invoice date is required');
    }
    if (!amount && amount !== 0) {
      throw badRequest('Amount is required');
    }

    const validStatuses = ['pending', 'paid', 'overdue'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO supplier_invoices (supplier_name, invoice_number, invoice_date, due_date,
       amount, status, category, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
      [supplier_name, invoice_number, invoice_date, due_date, amount, status, category, notes]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM supplier_invoices WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Supplier invoice not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'supplier_name', 'invoice_number', 'invoice_date', 'due_date',
      'amount', 'status', 'category', 'notes'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw badRequest('No valid fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE supplier_invoices SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM supplier_invoices WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const {
      limit = 100,
      offset = 0,
      supplier_name = null,
      status = null,
      category = null,
      from_date = null,
      to_date = null
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (supplier_name) {
      conditions.push(`supplier_name ILIKE $${paramCount}`);
      values.push(`%${supplier_name}%`);
      paramCount++;
    }

    if (status) {
      conditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (category) {
      conditions.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (from_date) {
      conditions.push(`invoice_date >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`invoice_date <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM supplier_invoices ${whereClause} ORDER BY invoice_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getBySupplier(supplierName, options = {}) {
    const { limit = 100, offset = 0, status = null } = options;

    const conditions = ['supplier_name = $1'];
    const values = [supplierName];
    let paramCount = 2;

    if (status) {
      conditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM supplier_invoices WHERE ${conditions.join(' AND ')}
       ORDER BY invoice_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getOverdue() {
    const result = await query(
      `SELECT * FROM supplier_invoices
       WHERE status = 'pending'
       AND due_date IS NOT NULL
       AND due_date < CURRENT_DATE
       ORDER BY due_date ASC`
    );

    // Auto-update status to overdue
    for (const invoice of result.rows) {
      await this.update(invoice.id, { status: 'overdue' });
    }

    return result.rows;
  }

  static async markAsPaid(id) {
    return await this.update(id, { status: 'paid' });
  }

  static async markAsOverdue(id) {
    return await this.update(id, { status: 'overdue' });
  }

  static async getStats(options = {}) {
    const { from_date = null, to_date = null, supplier_name = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (from_date) {
      conditions.push(`invoice_date >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`invoice_date <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    if (supplier_name) {
      conditions.push(`supplier_name = $${paramCount}`);
      values.push(supplier_name);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         status,
         COUNT(*) as count,
         SUM(amount) as total_amount,
         AVG(amount) as avg_amount
       FROM supplier_invoices
       ${whereClause}
       GROUP BY status
       ORDER BY status`,
      values
    );

    return result.rows;
  }

  static async getTotalsBySupplier(options = {}) {
    const { from_date = null, to_date = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (from_date) {
      conditions.push(`invoice_date >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`invoice_date <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         supplier_name,
         COUNT(*) as invoice_count,
         SUM(amount) as total_amount,
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
         SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount
       FROM supplier_invoices
       ${whereClause}
       GROUP BY supplier_name
       ORDER BY total_amount DESC`,
      values
    );

    return result.rows;
  }
}

export default SupplierInvoice;

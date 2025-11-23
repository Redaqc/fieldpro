/**
 * Expense Model
 * Manages job expenses and technician reimbursements
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Expense {
  /**
   * Create a new expense
   */
  static async create(data) {
    const {
      expense_number = null,
      job_id = null,
      technician_id,
      expense_date,
      expense_category, // travel, materials, equipment, meals, accommodation, other
      description,
      amount,
      currency = 'USD',
      payment_method = 'cash', // cash, credit_card, company_card, personal
      receipt_url = null,
      receipt_number = null,
      vendor = null,
      billable = true, // Can be billed to customer
      reimbursable = true, // Should be reimbursed to technician
      status = 'pending', // pending, approved, rejected, reimbursed
      approved_by = null,
      approved_at = null,
      reimbursed_at = null,
      notes = null,
      created_by = null
    } = data;

    if (!technician_id || !expense_date || !expense_category || !description || !amount) {
      throw badRequest('Required fields missing: technician_id, expense_date, expense_category, description, amount');
    }

    // Generate expense number if not provided
    let finalExpenseNumber = expense_number;
    if (!finalExpenseNumber) {
      const { generateSequentialNumber } = await import('../services/sequentialNumber.js');
      finalExpenseNumber = await generateSequentialNumber('expense', 'EXP-{YYYY}-{####}');
    }

    const result = await query(
      `INSERT INTO expenses (
        expense_number, job_id, technician_id, expense_date,
        expense_category, description, amount, currency,
        payment_method, receipt_url, receipt_number, vendor,
        billable, reimbursable, status, approved_by, approved_at,
        reimbursed_at, notes, created_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *`,
      [
        finalExpenseNumber, job_id, technician_id, expense_date,
        expense_category, description, amount, currency,
        payment_method, receipt_url, receipt_number, vendor,
        billable, reimbursable, status, approved_by, approved_at,
        reimbursed_at, notes, created_by
      ]
    );

    return result.rows[0];
  }

  /**
   * Find expense by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT e.*, t.first_name as tech_first_name, t.last_name as tech_last_name,
        j.job_number, j.customer_id
       FROM expenses e
       LEFT JOIN technicians t ON e.technician_id = t.id
       LEFT JOIN jobs j ON e.job_id = j.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Expense with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update expense
   */
  static async update(id, data) {
    const expense = await this.findById(id);

    const {
      job_id = expense.job_id,
      expense_date = expense.expense_date,
      expense_category = expense.expense_category,
      description = expense.description,
      amount = expense.amount,
      currency = expense.currency,
      payment_method = expense.payment_method,
      receipt_url = expense.receipt_url,
      receipt_number = expense.receipt_number,
      vendor = expense.vendor,
      billable = expense.billable,
      reimbursable = expense.reimbursable,
      status = expense.status,
      notes = expense.notes
    } = data;

    const result = await query(
      `UPDATE expenses SET
        job_id = $1, expense_date = $2, expense_category = $3,
        description = $4, amount = $5, currency = $6,
        payment_method = $7, receipt_url = $8, receipt_number = $9,
        vendor = $10, billable = $11, reimbursable = $12,
        status = $13, notes = $14, updated_at = NOW()
      WHERE id = $15
      RETURNING *`,
      [
        job_id, expense_date, expense_category, description,
        amount, currency, payment_method, receipt_url,
        receipt_number, vendor, billable, reimbursable,
        status, notes, id
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete expense
   */
  static async delete(id) {
    await this.findById(id);

    await query('DELETE FROM expenses WHERE id = $1', [id]);

    return { success: true, message: 'Expense deleted successfully' };
  }

  /**
   * List expenses with filters
   */
  static async list(filters = {}) {
    const {
      job_id = null,
      technician_id = null,
      expense_category = null,
      status = null,
      billable = null,
      reimbursable = null,
      start_date = null,
      end_date = null,
      search = null,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (job_id) {
      conditions.push(`e.job_id = $${paramCount}`);
      values.push(job_id);
      paramCount++;
    }

    if (technician_id) {
      conditions.push(`e.technician_id = $${paramCount}`);
      values.push(technician_id);
      paramCount++;
    }

    if (expense_category) {
      conditions.push(`e.expense_category = $${paramCount}`);
      values.push(expense_category);
      paramCount++;
    }

    if (status) {
      conditions.push(`e.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (billable !== null) {
      conditions.push(`e.billable = $${paramCount}`);
      values.push(billable);
      paramCount++;
    }

    if (reimbursable !== null) {
      conditions.push(`e.reimbursable = $${paramCount}`);
      values.push(reimbursable);
      paramCount++;
    }

    if (start_date) {
      conditions.push(`e.expense_date >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`e.expense_date <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (search) {
      conditions.push(`(e.expense_number ILIKE $${paramCount} OR e.description ILIKE $${paramCount} OR e.vendor ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT e.*, t.first_name as tech_first_name, t.last_name as tech_last_name,
        j.job_number
       FROM expenses e
       LEFT JOIN technicians t ON e.technician_id = t.id
       LEFT JOIN jobs j ON e.job_id = j.id
       ${whereClause}
       ORDER BY e.expense_date DESC, e.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM expenses e ${whereClause}`,
      values
    );

    return {
      expenses: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Approve expense
   */
  static async approve(id, approvedBy) {
    const result = await query(
      `UPDATE expenses SET
        status = 'approved',
        approved_by = $1,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *`,
      [approvedBy, id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Expense with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Reject expense
   */
  static async reject(id, rejectedBy, reason = null) {
    const expense = await this.findById(id);

    const result = await query(
      `UPDATE expenses SET
        status = 'rejected',
        approved_by = $1,
        approved_at = NOW(),
        notes = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *`,
      [rejectedBy, `${expense.notes || ''}\n\nRejection reason: ${reason || 'Not specified'}`, id]
    );

    return result.rows[0];
  }

  /**
   * Mark as reimbursed
   */
  static async markReimbursed(id, reimbursementData = {}) {
    const {
      reimbursed_at = new Date(),
      notes = null
    } = reimbursementData;

    const expense = await this.findById(id);

    if (expense.status !== 'approved') {
      throw badRequest('Only approved expenses can be marked as reimbursed');
    }

    const result = await query(
      `UPDATE expenses SET
        status = 'reimbursed',
        reimbursed_at = $1,
        notes = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *`,
      [reimbursed_at, notes || expense.notes, id]
    );

    return result.rows[0];
  }

  /**
   * Get expenses by technician
   */
  static async getByTechnician(technicianId, filters = {}) {
    const {
      status = null,
      start_date = null,
      end_date = null
    } = filters;

    return await this.list({
      technician_id: technicianId,
      status,
      start_date,
      end_date
    });
  }

  /**
   * Get expenses by job
   */
  static async getByJob(jobId) {
    return await this.list({ job_id: jobId });
  }

  /**
   * Get pending reimbursements
   */
  static async getPendingReimbursements(technicianId = null) {
    const conditions = [`e.status = 'approved'`, `e.reimbursable = true`];
    const values = [];
    let paramCount = 1;

    if (technicianId) {
      conditions.push(`e.technician_id = $${paramCount}`);
      values.push(technicianId);
      paramCount++;
    }

    const result = await query(
      `SELECT e.*, t.first_name as tech_first_name, t.last_name as tech_last_name,
        j.job_number
       FROM expenses e
       LEFT JOIN technicians t ON e.technician_id = t.id
       LEFT JOIN jobs j ON e.job_id = j.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.expense_date ASC`,
      values
    );

    const totalAmount = result.rows.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    return {
      expenses: result.rows,
      count: result.rows.length,
      total_amount: totalAmount
    };
  }

  /**
   * Get expense statistics
   */
  static async getStats(filters = {}) {
    const {
      technician_id = null,
      job_id = null,
      start_date = null,
      end_date = null
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (technician_id) {
      conditions.push(`technician_id = $${paramCount}`);
      values.push(technician_id);
      paramCount++;
    }

    if (job_id) {
      conditions.push(`job_id = $${paramCount}`);
      values.push(job_id);
      paramCount++;
    }

    if (start_date) {
      conditions.push(`expense_date >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`expense_date <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        COUNT(CASE WHEN status = 'reimbursed' THEN 1 END) as reimbursed_count,
        SUM(CASE WHEN status = 'reimbursed' THEN amount ELSE 0 END) as reimbursed_amount,
        COUNT(CASE WHEN billable = true THEN 1 END) as billable_count,
        SUM(CASE WHEN billable = true THEN amount ELSE 0 END) as billable_amount
       FROM expenses
       ${whereClause}`,
      values
    );

    const categoryResult = await query(
      `SELECT expense_category, COUNT(*) as count, SUM(amount) as total
       FROM expenses
       ${whereClause}
       GROUP BY expense_category
       ORDER BY total DESC`,
      values
    );

    return {
      overall: result.rows[0],
      by_category: categoryResult.rows.reduce((acc, row) => {
        acc[row.expense_category] = {
          count: parseInt(row.count),
          total: parseFloat(row.total)
        };
        return acc;
      }, {})
    };
  }

  /**
   * Bulk approve expenses
   */
  static async bulkApprove(expenseIds, approvedBy) {
    const result = await query(
      `UPDATE expenses SET
        status = 'approved',
        approved_by = $1,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = ANY($2)
      AND status = 'pending'
      RETURNING *`,
      [approvedBy, expenseIds]
    );

    return {
      success: true,
      approved_count: result.rows.length,
      expenses: result.rows
    };
  }

  /**
   * Bulk reimburse expenses
   */
  static async bulkReimburse(expenseIds, reimbursedAt = new Date()) {
    const result = await query(
      `UPDATE expenses SET
        status = 'reimbursed',
        reimbursed_at = $1,
        updated_at = NOW()
      WHERE id = ANY($2)
      AND status = 'approved'
      AND reimbursable = true
      RETURNING *`,
      [reimbursedAt, expenseIds]
    );

    return {
      success: true,
      reimbursed_count: result.rows.length,
      expenses: result.rows
    };
  }
}

export default Expense;

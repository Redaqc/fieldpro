/**
 * Contract Model
 * Manages service contracts and agreements
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Contract {
  /**
   * Create a new contract
   */
  static async create(data) {
    const {
      contract_number = null,
      customer_id,
      contract_name,
      contract_type = 'service', // service, maintenance, support, warranty
      status = 'draft', // draft, active, expired, cancelled, renewed
      start_date,
      end_date,
      billing_cycle = 'monthly', // monthly, quarterly, annually, one_time
      contract_value,
      currency = 'USD',
      payment_terms = 'net_30',
      auto_renew = false,
      renewal_notice_days = 30,
      terms_and_conditions = null,
      service_level = 'standard', // basic, standard, premium
      response_time_hours = 24,
      coverage_hours = 'business', // business, 24/7, custom
      included_services = [], // Array of service descriptions
      excluded_services = [],
      assigned_technician_id = null,
      notes = null,
      created_by = null
    } = data;

    if (!customer_id || !contract_name || !start_date || !end_date) {
      throw badRequest('Required fields missing: customer_id, contract_name, start_date, end_date');
    }

    // Generate contract number if not provided
    let finalContractNumber = contract_number;
    if (!finalContractNumber) {
      const { generateSequentialNumber } = await import('../services/sequentialNumber.js');
      finalContractNumber = await generateSequentialNumber('contract', 'CNT-{YYYY}-{####}');
    }

    const result = await query(
      `INSERT INTO contracts (
        contract_number, customer_id, contract_name, contract_type, status,
        start_date, end_date, billing_cycle, contract_value, currency,
        payment_terms, auto_renew, renewal_notice_days, terms_and_conditions,
        service_level, response_time_hours, coverage_hours,
        included_services, excluded_services, assigned_technician_id,
        notes, created_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
      RETURNING *`,
      [
        finalContractNumber, customer_id, contract_name, contract_type, status,
        start_date, end_date, billing_cycle, contract_value, currency,
        payment_terms, auto_renew, renewal_notice_days, terms_and_conditions,
        service_level, response_time_hours, coverage_hours,
        JSON.stringify(included_services), JSON.stringify(excluded_services),
        assigned_technician_id, notes, created_by
      ]
    );

    return result.rows[0];
  }

  /**
   * Find contract by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT c.*, cu.company_name, cu.email as customer_email, cu.phone as customer_phone
       FROM contracts c
       LEFT JOIN customers cu ON c.customer_id = cu.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Contract with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update contract
   */
  static async update(id, data) {
    const contract = await this.findById(id);

    const {
      contract_name = contract.contract_name,
      contract_type = contract.contract_type,
      status = contract.status,
      start_date = contract.start_date,
      end_date = contract.end_date,
      billing_cycle = contract.billing_cycle,
      contract_value = contract.contract_value,
      currency = contract.currency,
      payment_terms = contract.payment_terms,
      auto_renew = contract.auto_renew,
      renewal_notice_days = contract.renewal_notice_days,
      terms_and_conditions = contract.terms_and_conditions,
      service_level = contract.service_level,
      response_time_hours = contract.response_time_hours,
      coverage_hours = contract.coverage_hours,
      included_services = contract.included_services,
      excluded_services = contract.excluded_services,
      assigned_technician_id = contract.assigned_technician_id,
      notes = contract.notes
    } = data;

    const result = await query(
      `UPDATE contracts SET
        contract_name = $1, contract_type = $2, status = $3,
        start_date = $4, end_date = $5, billing_cycle = $6,
        contract_value = $7, currency = $8, payment_terms = $9,
        auto_renew = $10, renewal_notice_days = $11,
        terms_and_conditions = $12, service_level = $13,
        response_time_hours = $14, coverage_hours = $15,
        included_services = $16, excluded_services = $17,
        assigned_technician_id = $18, notes = $19,
        updated_at = NOW()
      WHERE id = $20
      RETURNING *`,
      [
        contract_name, contract_type, status, start_date, end_date,
        billing_cycle, contract_value, currency, payment_terms,
        auto_renew, renewal_notice_days, terms_and_conditions,
        service_level, response_time_hours, coverage_hours,
        JSON.stringify(included_services), JSON.stringify(excluded_services),
        assigned_technician_id, notes, id
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete contract
   */
  static async delete(id) {
    await this.findById(id);

    await query('DELETE FROM contracts WHERE id = $1', [id]);

    return { success: true, message: 'Contract deleted successfully' };
  }

  /**
   * List contracts with filters
   */
  static async list(filters = {}) {
    const {
      customer_id = null,
      status = null,
      contract_type = null,
      service_level = null,
      expiring_soon_days = null,
      auto_renew = null,
      search = null,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (customer_id) {
      conditions.push(`c.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    if (status) {
      conditions.push(`c.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (contract_type) {
      conditions.push(`c.contract_type = $${paramCount}`);
      values.push(contract_type);
      paramCount++;
    }

    if (service_level) {
      conditions.push(`c.service_level = $${paramCount}`);
      values.push(service_level);
      paramCount++;
    }

    if (expiring_soon_days) {
      conditions.push(`c.end_date <= NOW() + INTERVAL '${expiring_soon_days} days'`);
      conditions.push(`c.status = 'active'`);
    }

    if (auto_renew !== null) {
      conditions.push(`c.auto_renew = $${paramCount}`);
      values.push(auto_renew);
      paramCount++;
    }

    if (search) {
      conditions.push(`(c.contract_number ILIKE $${paramCount} OR c.contract_name ILIKE $${paramCount} OR cu.company_name ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT c.*, cu.company_name, cu.email as customer_email
       FROM contracts c
       LEFT JOIN customers cu ON c.customer_id = cu.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM contracts c
       LEFT JOIN customers cu ON c.customer_id = cu.id
       ${whereClause}`,
      values
    );

    return {
      contracts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Activate contract
   */
  static async activate(id) {
    return await this.update(id, {
      status: 'active'
    });
  }

  /**
   * Cancel contract
   */
  static async cancel(id, reason = null) {
    const contract = await this.update(id, {
      status: 'cancelled'
    });

    if (reason) {
      await this.update(id, {
        notes: `${contract.notes || ''}\n\nCancellation reason: ${reason}`
      });
    }

    return contract;
  }

  /**
   * Renew contract
   */
  static async renew(id, data = {}) {
    const oldContract = await this.findById(id);

    const {
      end_date = new Date(new Date(oldContract.end_date).setFullYear(new Date(oldContract.end_date).getFullYear() + 1)),
      contract_value = oldContract.contract_value,
      service_level = oldContract.service_level
    } = data;

    // Mark old contract as renewed
    await this.update(id, {
      status: 'renewed'
    });

    // Create new contract
    const newContract = await this.create({
      customer_id: oldContract.customer_id,
      contract_name: oldContract.contract_name,
      contract_type: oldContract.contract_type,
      status: 'active',
      start_date: oldContract.end_date,
      end_date,
      billing_cycle: oldContract.billing_cycle,
      contract_value,
      currency: oldContract.currency,
      payment_terms: oldContract.payment_terms,
      auto_renew: oldContract.auto_renew,
      renewal_notice_days: oldContract.renewal_notice_days,
      terms_and_conditions: oldContract.terms_and_conditions,
      service_level,
      response_time_hours: oldContract.response_time_hours,
      coverage_hours: oldContract.coverage_hours,
      included_services: oldContract.included_services,
      excluded_services: oldContract.excluded_services,
      assigned_technician_id: oldContract.assigned_technician_id,
      notes: `Renewed from contract ${oldContract.contract_number}`
    });

    return {
      old_contract: oldContract,
      new_contract: newContract
    };
  }

  /**
   * Get contracts expiring soon
   */
  static async getExpiringSoon(days = 30) {
    const result = await query(
      `SELECT c.*, cu.company_name, cu.email as customer_email
       FROM contracts c
       LEFT JOIN customers cu ON c.customer_id = cu.id
       WHERE c.status = 'active'
       AND c.end_date <= NOW() + INTERVAL '${days} days'
       AND c.end_date >= NOW()
       ORDER BY c.end_date ASC`,
      []
    );

    return result.rows;
  }

  /**
   * Get contract statistics
   */
  static async getStats(contractId) {
    const contract = await this.findById(contractId);

    // Count jobs under this contract
    const jobsResult = await query(
      `SELECT COUNT(*) as count, status
       FROM jobs
       WHERE contract_id = $1
       GROUP BY status`,
      [contractId]
    );

    // Count invoices under this contract
    const invoicesResult = await query(
      `SELECT COUNT(*) as count, SUM(total_amount) as total_revenue
       FROM invoices
       WHERE contract_id = $1`,
      [contractId]
    );

    // Calculate days remaining
    const daysRemaining = Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24));

    return {
      contract,
      jobs_by_status: jobsResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      total_jobs: jobsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      total_invoices: parseInt(invoicesResult.rows[0]?.count || 0),
      total_revenue: parseFloat(invoicesResult.rows[0]?.total_revenue || 0),
      days_remaining: daysRemaining,
      is_expiring_soon: daysRemaining <= contract.renewal_notice_days
    };
  }

  /**
   * Get all contracts summary
   */
  static async getSummary() {
    const result = await query(
      `SELECT
        status,
        COUNT(*) as count,
        SUM(contract_value) as total_value
       FROM contracts
       GROUP BY status`,
      []
    );

    const expiringSoon = await this.getExpiringSoon(30);

    return {
      by_status: result.rows.reduce((acc, row) => {
        acc[row.status] = {
          count: parseInt(row.count),
          total_value: parseFloat(row.total_value || 0)
        };
        return acc;
      }, {}),
      expiring_soon_count: expiringSoon.length,
      expiring_soon: expiringSoon.slice(0, 10)
    };
  }
}

export default Contract;

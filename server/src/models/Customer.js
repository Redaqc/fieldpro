/**
 * Customer Model
 * Complete CRUD operations for Customer entity
 * Replaces base44.entities.Customer.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Customer {
  /**
   * Create a new customer
   * @param {Object} data - Customer data
   * @returns {Promise<Object>} Created customer
   */
  static async create(data) {
    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zip,
      country = 'USA',
      contact_person,
      notes,
      tags = [],
      is_active = true,
      custom_fields = {}
    } = data;

    // Validate required fields
    if (!name) {
      throw badRequest('Customer name is required');
    }

    const result = await query(
      `INSERT INTO customers (
        name, email, phone, company, address, city, state, zip, country,
        contact_person, notes, tags, is_active, custom_fields, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        name, email, phone, company, address, city, state, zip, country,
        contact_person, notes, tags, is_active, custom_fields
      ]
    );

    return result.rows[0];
  }

  /**
   * Get customer by ID
   * @param {string} id - Customer UUID
   * @returns {Promise<Object>} Customer record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Customer with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update customer
   * @param {string} id - Customer UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated customer
   */
  static async update(id, data) {
    // First check if customer exists
    await this.findById(id);

    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zip,
      country,
      contact_person,
      notes,
      tags,
      is_active,
      custom_fields
    } = data;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(company);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(state);
    }
    if (zip !== undefined) {
      updates.push(`zip = $${paramCount++}`);
      values.push(zip);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramCount++}`);
      values.push(country);
    }
    if (contact_person !== undefined) {
      updates.push(`contact_person = $${paramCount++}`);
      values.push(contact_person);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(tags);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (custom_fields !== undefined) {
      updates.push(`custom_fields = $${paramCount++}`);
      values.push(custom_fields);
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at would be updated
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE customers
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete customer
   * @param {string} id - Customer UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    // Check if customer exists
    await this.findById(id);

    // Check if customer has related records
    const jobsCheck = await query(
      'SELECT COUNT(*) as count FROM jobs WHERE customer_id = $1',
      [id]
    );

    if (parseInt(jobsCheck.rows[0].count) > 0) {
      throw badRequest('Cannot delete customer with existing jobs. Archive instead.');
    }

    await query('DELETE FROM customers WHERE id = $1', [id]);
    return true;
  }

  /**
   * List all customers with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Customers and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      is_active
    } = options;

    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      whereClause = `WHERE is_active = $${paramCount++}`;
      values.push(is_active);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM customers ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM customers
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
   * Filter customers with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered customers
   */
  static async filter(filters = {}) {
    const {
      search,
      tags,
      is_active,
      city,
      state,
      country,
      created_after,
      created_before,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Search in name, email, company, contact_person
    if (search) {
      conditions.push(`(
        name ILIKE $${paramCount} OR
        email ILIKE $${paramCount} OR
        company ILIKE $${paramCount} OR
        contact_person ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filter by tags (array contains)
    if (tags && tags.length > 0) {
      conditions.push(`tags && $${paramCount}`);
      values.push(tags);
      paramCount++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    // Filter by location
    if (city) {
      conditions.push(`city ILIKE $${paramCount}`);
      values.push(`%${city}%`);
      paramCount++;
    }

    if (state) {
      conditions.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }

    if (country) {
      conditions.push(`country = $${paramCount}`);
      values.push(country);
      paramCount++;
    }

    // Date range filters
    if (created_after) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(created_after);
      paramCount++;
    }

    if (created_before) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(created_before);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM customers
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Search customers by text
   * @param {string} searchText - Search query
   * @returns {Promise<Array>} Matching customers
   */
  static async search(searchText) {
    const result = await query(
      `SELECT * FROM customers
       WHERE name ILIKE $1
          OR email ILIKE $1
          OR company ILIKE $1
          OR contact_person ILIKE $1
          OR phone ILIKE $1
       ORDER BY name ASC
       LIMIT 50`,
      [`%${searchText}%`]
    );

    return result.rows;
  }

  /**
   * Get customer with related data (jobs, invoices, etc.)
   * @param {string} id - Customer UUID
   * @returns {Promise<Object>} Customer with relations
   */
  static async findWithRelations(id) {
    const customer = await this.findById(id);

    // Get related jobs
    const jobs = await query(
      `SELECT id, job_number, title, status, scheduled_date, total_amount
       FROM jobs
       WHERE customer_id = $1
       ORDER BY scheduled_date DESC
       LIMIT 10`,
      [id]
    );

    // Get related invoices
    const invoices = await query(
      `SELECT id, invoice_number, status, total_amount, due_date
       FROM invoices
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get related quotations
    const quotations = await query(
      `SELECT id, quote_number, status, total_amount, valid_until
       FROM quotations
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    return {
      ...customer,
      recent_jobs: jobs.rows,
      recent_invoices: invoices.rows,
      recent_quotations: quotations.rows
    };
  }

  /**
   * Archive customer (soft delete)
   * @param {string} id - Customer UUID
   * @returns {Promise<Object>} Archived customer
   */
  static async archive(id) {
    return await this.update(id, { is_active: false });
  }

  /**
   * Restore archived customer
   * @param {string} id - Customer UUID
   * @returns {Promise<Object>} Restored customer
   */
  static async restore(id) {
    return await this.update(id, { is_active: true });
  }
}

export default Customer;

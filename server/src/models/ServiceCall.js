/**
 * ServiceCall Model
 * Complete CRUD operations for ServiceCall entity
 * Replaces base44.entities.ServiceCall.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class ServiceCall {
  /**
   * Create a new service call
   * @param {Object} data - Service call data
   * @returns {Promise<Object>} Created service call
   */
  static async create(data) {
    const {
      customer_id,
      job_id,
      priority = 'medium',
      status = 'open',
      issue_description,
      resolution_notes,
      assigned_to,
      call_date = new Date().toISOString(),
      resolved_date,
      category,
      tags = [],
      custom_fields = {}
    } = data;

    // Validate required fields
    if (!customer_id) {
      throw badRequest('Customer ID is required');
    }
    if (!issue_description) {
      throw badRequest('Issue description is required');
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw badRequest(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO service_calls (
        customer_id, job_id, priority, status, issue_description,
        resolution_notes, assigned_to, call_date, resolved_date,
        category, tags, custom_fields, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        customer_id, job_id, priority, status, issue_description,
        resolution_notes, assigned_to, call_date, resolved_date,
        category, tags, custom_fields
      ]
    );

    return result.rows[0];
  }

  /**
   * Get service call by ID
   * @param {string} id - ServiceCall UUID
   * @returns {Promise<Object>} ServiceCall record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM service_calls WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Service call with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update service call
   * @param {string} id - ServiceCall UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated service call
   */
  static async update(id, data) {
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      customer_id: 'customer_id',
      job_id: 'job_id',
      priority: 'priority',
      status: 'status',
      issue_description: 'issue_description',
      resolution_notes: 'resolution_notes',
      assigned_to: 'assigned_to',
      call_date: 'call_date',
      resolved_date: 'resolved_date',
      category: 'category',
      tags: 'tags',
      custom_fields: 'custom_fields'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Validate priority if being updated
    if (data.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(data.priority)) {
        throw badRequest(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Validate status if being updated
    if (data.status) {
      const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'];
      if (!validStatuses.includes(data.status)) {
        throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Auto-set resolved_date when status becomes resolved/closed
      if ((data.status === 'resolved' || data.status === 'closed') && !data.resolved_date) {
        updates.push(`resolved_date = NOW()`);
      }
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE service_calls
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete service call
   * @param {string} id - ServiceCall UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM service_calls WHERE id = $1', [id]);
    return true;
  }

  /**
   * List service calls with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Service calls and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'call_date',
      sortOrder = 'DESC',
      status,
      priority,
      customer_id
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (customer_id) {
      conditions.push(`customer_id = $${paramCount++}`);
      values.push(customer_id);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM service_calls ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await query(
      `SELECT
        sc.*,
        c.name as customer_name,
        u.name as assigned_to_name
       FROM service_calls sc
       LEFT JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.assigned_to = u.id
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
   * Filter service calls
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered service calls
   */
  static async filter(filters = {}) {
    const {
      search,
      status,
      priority,
      customer_id,
      assigned_to,
      category,
      tags,
      call_date_after,
      call_date_before,
      is_unresolved,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        sc.issue_description ILIKE $${paramCount} OR
        sc.resolution_notes ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      if (Array.isArray(status)) {
        conditions.push(`sc.status = ANY($${paramCount})`);
        values.push(status);
      } else {
        conditions.push(`sc.status = $${paramCount}`);
        values.push(status);
      }
      paramCount++;
    }

    if (priority) {
      if (Array.isArray(priority)) {
        conditions.push(`sc.priority = ANY($${paramCount})`);
        values.push(priority);
      } else {
        conditions.push(`sc.priority = $${paramCount}`);
        values.push(priority);
      }
      paramCount++;
    }

    if (customer_id) {
      conditions.push(`sc.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    if (assigned_to) {
      conditions.push(`sc.assigned_to = $${paramCount}`);
      values.push(assigned_to);
      paramCount++;
    }

    if (category) {
      conditions.push(`sc.category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (tags && tags.length > 0) {
      conditions.push(`sc.tags && $${paramCount}`);
      values.push(tags);
      paramCount++;
    }

    if (call_date_after) {
      conditions.push(`sc.call_date >= $${paramCount}`);
      values.push(call_date_after);
      paramCount++;
    }

    if (call_date_before) {
      conditions.push(`sc.call_date <= $${paramCount}`);
      values.push(call_date_before);
      paramCount++;
    }

    if (is_unresolved) {
      conditions.push(`sc.status NOT IN ('resolved', 'closed', 'cancelled')`);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT
        sc.*,
        c.name as customer_name,
        u.name as assigned_to_name
       FROM service_calls sc
       LEFT JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.assigned_to = u.id
       ${whereClause}
       ORDER BY sc.call_date DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Get open service calls
   * @returns {Promise<Array>} Open service calls
   */
  static async getOpen() {
    const result = await query(
      `SELECT
        sc.*,
        c.name as customer_name
       FROM service_calls sc
       LEFT JOIN customers c ON sc.customer_id = c.id
       WHERE sc.status IN ('open', 'in_progress', 'pending')
       ORDER BY sc.priority DESC, sc.call_date ASC`,
      []
    );

    return result.rows;
  }

  /**
   * Resolve service call
   * @param {string} id - ServiceCall UUID
   * @param {string} resolutionNotes - Resolution notes
   * @returns {Promise<Object>} Updated service call
   */
  static async resolve(id, resolutionNotes) {
    return await this.update(id, {
      status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_date: new Date().toISOString()
    });
  }

  /**
   * Assign service call
   * @param {string} id - ServiceCall UUID
   * @param {string} userId - User ID to assign to
   * @returns {Promise<Object>} Updated service call
   */
  static async assign(id, userId) {
    return await this.update(id, {
      assigned_to: userId,
      status: 'in_progress'
    });
  }
}

export default ServiceCall;

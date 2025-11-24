/**
 * Job Model
 * Complete CRUD operations for Job entity
 * Replaces base44.entities.Job.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Job {
  /**
   * Create a new job
   * @param {Object} data - Job data
   * @returns {Promise<Object>} Created job
   */
  static async create(data) {
    const {
      job_number,
      customer_id,
      title,
      description,
      status = 'to_do',
      priority = 'medium',
      scheduled_date,
      scheduled_end_date,
      assigned_technician_id,
      location_address,
      location_city,
      location_state,
      location_zip,
      location_country,
      gps_coordinates,
      required_skills = [],
      estimated_duration_hours,
      instructions,
      notes,
      tags = [],
      custom_fields = {},
      total_amount = 0,
      is_recurring = false,
      parent_recurring_job_id
    } = data;

    // Validate required fields
    if (!customer_id) {
      throw badRequest('Customer ID is required');
    }
    if (!title) {
      throw badRequest('Job title is required');
    }

    // Validate status
    const validStatuses = ['to_do', 'in_progress', 'review', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw badRequest(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO jobs (
        job_number, customer_id, title, description, status, priority,
        scheduled_date, scheduled_end_date, assigned_technician_id,
        location_address, location_city, location_state, location_zip, location_country,
        gps_coordinates, required_skills, estimated_duration_hours,
        instructions, notes, tags, custom_fields, total_amount,
        is_recurring, parent_recurring_job_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
      RETURNING *`,
      [
        job_number, customer_id, title, description, status, priority,
        scheduled_date, scheduled_end_date, assigned_technician_id,
        location_address, location_city, location_state, location_zip, location_country,
        gps_coordinates ? JSON.stringify(gps_coordinates) : null,
        required_skills, estimated_duration_hours,
        instructions, notes, tags, custom_fields, total_amount,
        is_recurring, parent_recurring_job_id
      ]
    );

    return result.rows[0];
  }

  /**
   * Get job by ID
   * @param {string} id - Job UUID
   * @returns {Promise<Object>} Job record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Job with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update job
   * @param {string} id - Job UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated job
   */
  static async update(id, data) {
    // First check if job exists
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query for all possible fields
    const fieldMappings = {
      job_number: 'job_number',
      customer_id: 'customer_id',
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      scheduled_date: 'scheduled_date',
      scheduled_end_date: 'scheduled_end_date',
      actual_start_date: 'actual_start_date',
      actual_end_date: 'actual_end_date',
      assigned_technician_id: 'assigned_technician_id',
      location_address: 'location_address',
      location_city: 'location_city',
      location_state: 'location_state',
      location_zip: 'location_zip',
      location_country: 'location_country',
      required_skills: 'required_skills',
      estimated_duration_hours: 'estimated_duration_hours',
      actual_duration_hours: 'actual_duration_hours',
      instructions: 'instructions',
      notes: 'notes',
      tags: 'tags',
      custom_fields: 'custom_fields',
      total_amount: 'total_amount',
      is_recurring: 'is_recurring',
      parent_recurring_job_id: 'parent_recurring_job_id'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Handle GPS coordinates (needs JSON stringification)
    if (data.gps_coordinates !== undefined) {
      updates.push(`gps_coordinates = $${paramCount++}`);
      values.push(data.gps_coordinates ? JSON.stringify(data.gps_coordinates) : null);
    }

    // Validate status if being updated
    if (data.status) {
      const validStatuses = ['to_do', 'in_progress', 'review', 'completed', 'cancelled'];
      if (!validStatuses.includes(data.status)) {
        throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate priority if being updated
    if (data.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(data.priority)) {
        throw badRequest(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE jobs
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete job
   * @param {string} id - Job UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    await this.findById(id);

    // Use transaction to delete related records
    await transaction(async (client) => {
      // Delete related time entries
      await client.query('DELETE FROM time_entries WHERE job_id = $1', [id]);

      // Delete related job materials
      await client.query('DELETE FROM job_materials WHERE job_id = $1', [id]);

      // Delete the job
      await client.query('DELETE FROM jobs WHERE id = $1', [id]);
    });

    return true;
  }

  /**
   * List jobs with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Jobs and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'scheduled_date',
      sortOrder = 'DESC',
      status,
      assigned_technician_id,
      customer_id
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (assigned_technician_id) {
      conditions.push(`assigned_technician_id = $${paramCount++}`);
      values.push(assigned_technician_id);
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
      `SELECT COUNT(*) as total FROM jobs ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        t.first_name || ' ' || t.last_name as technician_name
       FROM jobs j
       LEFT JOIN customers c ON j.customer_id = c.id
       LEFT JOIN technicians t ON j.assigned_technician_id = t.id
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
   * Filter jobs with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered jobs
   */
  static async filter(filters = {}) {
    const {
      search,
      status,
      priority,
      customer_id,
      assigned_technician_id,
      tags,
      scheduled_after,
      scheduled_before,
      location_city,
      location_state,
      is_recurring,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Search in title, description, job_number
    if (search) {
      conditions.push(`(
        j.title ILIKE $${paramCount} OR
        j.description ILIKE $${paramCount} OR
        j.job_number ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filter by status
    if (status) {
      if (Array.isArray(status)) {
        conditions.push(`j.status = ANY($${paramCount})`);
        values.push(status);
      } else {
        conditions.push(`j.status = $${paramCount}`);
        values.push(status);
      }
      paramCount++;
    }

    // Filter by priority
    if (priority) {
      if (Array.isArray(priority)) {
        conditions.push(`j.priority = ANY($${paramCount})`);
        values.push(priority);
      } else {
        conditions.push(`j.priority = $${paramCount}`);
        values.push(priority);
      }
      paramCount++;
    }

    // Filter by customer
    if (customer_id) {
      conditions.push(`j.customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    // Filter by technician
    if (assigned_technician_id) {
      conditions.push(`j.assigned_technician_id = $${paramCount}`);
      values.push(assigned_technician_id);
      paramCount++;
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      conditions.push(`j.tags && $${paramCount}`);
      values.push(tags);
      paramCount++;
    }

    // Date range filters
    if (scheduled_after) {
      conditions.push(`j.scheduled_date >= $${paramCount}`);
      values.push(scheduled_after);
      paramCount++;
    }

    if (scheduled_before) {
      conditions.push(`j.scheduled_date <= $${paramCount}`);
      values.push(scheduled_before);
      paramCount++;
    }

    // Location filters
    if (location_city) {
      conditions.push(`j.location_city ILIKE $${paramCount}`);
      values.push(`%${location_city}%`);
      paramCount++;
    }

    if (location_state) {
      conditions.push(`j.location_state = $${paramCount}`);
      values.push(location_state);
      paramCount++;
    }

    // Recurring filter
    if (is_recurring !== undefined) {
      conditions.push(`j.is_recurring = $${paramCount}`);
      values.push(is_recurring);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        t.first_name || ' ' || t.last_name as technician_name
       FROM jobs j
       LEFT JOIN customers c ON j.customer_id = c.id
       LEFT JOIN technicians t ON j.assigned_technician_id = t.id
       ${whereClause}
       ORDER BY j.scheduled_date DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Get job with all related data
   * @param {string} id - Job UUID
   * @returns {Promise<Object>} Job with relations
   */
  static async findWithRelations(id) {
    const job = await this.findById(id);

    // Get customer details
    const customer = await query(
      'SELECT * FROM customers WHERE id = $1',
      [job.customer_id]
    );

    // Get technician details
    let technician = null;
    if (job.assigned_technician_id) {
      const techResult = await query(
        'SELECT * FROM technicians WHERE id = $1',
        [job.assigned_technician_id]
      );
      technician = techResult.rows[0] || null;
    }

    // Get time entries
    const timeEntries = await query(
      `SELECT * FROM time_entries
       WHERE job_id = $1
       ORDER BY clock_in DESC`,
      [id]
    );

    // Get materials used
    const materials = await query(
      `SELECT jm.*, m.name, m.sku, m.unit_price
       FROM job_materials jm
       JOIN materials m ON jm.material_id = m.id
       WHERE jm.job_id = $1`,
      [id]
    );

    // Get related invoices
    const invoices = await query(
      `SELECT * FROM invoices
       WHERE job_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return {
      ...job,
      customer: customer.rows[0] || null,
      technician,
      time_entries: timeEntries.rows,
      materials: materials.rows,
      invoices: invoices.rows
    };
  }

  /**
   * Assign technician to job
   * @param {string} jobId - Job UUID
   * @param {string} technicianId - Technician UUID
   * @returns {Promise<Object>} Updated job
   */
  static async assignTechnician(jobId, technicianId) {
    return await this.update(jobId, { assigned_technician_id: technicianId });
  }

  /**
   * Update job status
   * @param {string} id - Job UUID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated job
   */
  static async updateStatus(id, status) {
    const updates = { status };

    // Auto-set dates based on status
    if (status === 'in_progress' && !updates.actual_start_date) {
      updates.actual_start_date = new Date().toISOString();
    }
    if (status === 'completed' && !updates.actual_end_date) {
      updates.actual_end_date = new Date().toISOString();
    }

    return await this.update(id, updates);
  }

  /**
   * Add material to job
   * @param {string} jobId - Job UUID
   * @param {string} materialId - Material UUID
   * @param {number} quantity - Quantity used
   * @returns {Promise<Object>} Job material record
   */
  static async addMaterial(jobId, materialId, quantity) {
    const result = await query(
      `INSERT INTO job_materials (job_id, material_id, quantity_used)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [jobId, materialId, quantity]
    );

    return result.rows[0];
  }

  /**
   * Get jobs by technician
   * @param {string} technicianId - Technician UUID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Jobs assigned to technician
   */
  static async getByTechnician(technicianId, options = {}) {
    const { status, limit = 50 } = options;

    let whereClause = 'WHERE assigned_technician_id = $1';
    const values = [technicianId];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    values.push(limit);

    const result = await query(
      `SELECT j.*, c.name as customer_name
       FROM jobs j
       LEFT JOIN customers c ON j.customer_id = c.id
       ${whereClause}
       ORDER BY scheduled_date ASC
       LIMIT $${paramCount}`,
      values
    );

    return result.rows;
  }

  /**
   * Get upcoming jobs (next 7 days)
   * @returns {Promise<Array>} Upcoming jobs
   */
  static async getUpcoming() {
    const result = await query(
      `SELECT j.*, c.name as customer_name,
              t.first_name || ' ' || t.last_name as technician_name
       FROM jobs j
       LEFT JOIN customers c ON j.customer_id = c.id
       LEFT JOIN technicians t ON j.assigned_technician_id = t.id
       WHERE j.scheduled_date >= CURRENT_DATE
         AND j.scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
         AND j.status NOT IN ('completed', 'cancelled')
       ORDER BY j.scheduled_date ASC`,
      []
    );

    return result.rows;
  }
}

export default Job;

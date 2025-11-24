/**
 * Technician Model
 * Complete CRUD operations for Technician entity
 * Replaces base44.entities.Technician.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Technician {
  /**
   * Create a new technician
   * @param {Object} data - Technician data
   * @returns {Promise<Object>} Created technician
   */
  static async create(data) {
    const {
      user_id,
      first_name,
      last_name,
      email,
      phone,
      skills = [],
      certifications = [],
      hourly_rate = 0,
      experience_level = 'junior',
      address,
      city,
      state,
      zip,
      country = 'USA',
      emergency_contact_name,
      emergency_contact_phone,
      hire_date = new Date().toISOString(),
      is_active = true,
      notes,
      custom_fields = {}
    } = data;

    // Validate required fields
    if (!first_name || !last_name) {
      throw badRequest('First name and last name are required');
    }
    if (!email) {
      throw badRequest('Email is required');
    }

    // Validate experience level
    const validLevels = ['junior', 'intermediate', 'senior', 'expert'];
    if (!validLevels.includes(experience_level)) {
      throw badRequest(`Invalid experience level. Must be one of: ${validLevels.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO technicians (
        user_id, first_name, last_name, email, phone, skills, certifications,
        hourly_rate, experience_level, address, city, state, zip, country,
        emergency_contact_name, emergency_contact_phone, hire_date,
        is_active, notes, custom_fields, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *`,
      [
        user_id, first_name, last_name, email, phone, skills, certifications,
        hourly_rate, experience_level, address, city, state, zip, country,
        emergency_contact_name, emergency_contact_phone, hire_date,
        is_active, notes, custom_fields
      ]
    );

    return result.rows[0];
  }

  /**
   * Get technician by ID
   * @param {string} id - Technician UUID
   * @returns {Promise<Object>} Technician record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM technicians WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Technician with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Get technician by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Technician record
   */
  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM technicians WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw notFound(`Technician with user ID ${userId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update technician
   * @param {string} id - Technician UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated technician
   */
  static async update(id, data) {
    // First check if technician exists
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      user_id: 'user_id',
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'email',
      phone: 'phone',
      skills: 'skills',
      certifications: 'certifications',
      hourly_rate: 'hourly_rate',
      experience_level: 'experience_level',
      address: 'address',
      city: 'city',
      state: 'state',
      zip: 'zip',
      country: 'country',
      emergency_contact_name: 'emergency_contact_name',
      emergency_contact_phone: 'emergency_contact_phone',
      hire_date: 'hire_date',
      termination_date: 'termination_date',
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

    // Validate experience level if being updated
    if (data.experience_level) {
      const validLevels = ['junior', 'intermediate', 'senior', 'expert'];
      if (!validLevels.includes(data.experience_level)) {
        throw badRequest(`Invalid experience level. Must be one of: ${validLevels.join(', ')}`);
      }
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE technicians
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete technician
   * @param {string} id - Technician UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    await this.findById(id);

    // Check for related records
    const jobsCheck = await query(
      'SELECT COUNT(*) as count FROM jobs WHERE assigned_technician_id = $1',
      [id]
    );

    if (parseInt(jobsCheck.rows[0].count) > 0) {
      throw badRequest('Cannot delete technician with assigned jobs. Deactivate instead.');
    }

    await query('DELETE FROM technicians WHERE id = $1', [id]);
    return true;
  }

  /**
   * List technicians with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Technicians and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'last_name',
      sortOrder = 'ASC',
      is_active
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM technicians ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM technicians
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
   * Filter technicians with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered technicians
   */
  static async filter(filters = {}) {
    const {
      search,
      skills,
      experience_level,
      is_active,
      city,
      state,
      min_hourly_rate,
      max_hourly_rate,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Search in name, email
    if (search) {
      conditions.push(`(
        first_name ILIKE $${paramCount} OR
        last_name ILIKE $${paramCount} OR
        email ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filter by skills (array contains)
    if (skills && skills.length > 0) {
      conditions.push(`skills && $${paramCount}`);
      values.push(skills);
      paramCount++;
    }

    // Filter by experience level
    if (experience_level) {
      if (Array.isArray(experience_level)) {
        conditions.push(`experience_level = ANY($${paramCount})`);
        values.push(experience_level);
      } else {
        conditions.push(`experience_level = $${paramCount}`);
        values.push(experience_level);
      }
      paramCount++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    // Location filters
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

    // Hourly rate filters
    if (min_hourly_rate !== undefined) {
      conditions.push(`hourly_rate >= $${paramCount}`);
      values.push(min_hourly_rate);
      paramCount++;
    }

    if (max_hourly_rate !== undefined) {
      conditions.push(`hourly_rate <= $${paramCount}`);
      values.push(max_hourly_rate);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM technicians
       ${whereClause}
       ORDER BY last_name ASC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Get technician with related data
   * @param {string} id - Technician UUID
   * @returns {Promise<Object>} Technician with relations
   */
  static async findWithRelations(id) {
    const technician = await this.findById(id);

    // Get assigned jobs
    const jobs = await query(
      `SELECT j.*, c.name as customer_name
       FROM jobs j
       LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.assigned_technician_id = $1
       ORDER BY j.scheduled_date DESC
       LIMIT 20`,
      [id]
    );

    // Get time entries
    const timeEntries = await query(
      `SELECT te.*, j.job_number, j.title as job_title
       FROM time_entries te
       LEFT JOIN jobs j ON te.job_id = j.id
       WHERE te.technician_id = $1
       ORDER BY te.clock_in DESC
       LIMIT 20`,
      [id]
    );

    // Get statistics
    const stats = await query(
      `SELECT
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as completed_jobs,
        SUM(te.duration_hours) as total_hours_worked,
        SUM(te.total_cost) as total_revenue_generated
       FROM technicians t
       LEFT JOIN jobs j ON j.assigned_technician_id = t.id
       LEFT JOIN time_entries te ON te.technician_id = t.id
       WHERE t.id = $1`,
      [id]
    );

    return {
      ...technician,
      assigned_jobs: jobs.rows,
      recent_time_entries: timeEntries.rows,
      statistics: stats.rows[0]
    };
  }

  /**
   * Get available technicians for a job
   * @param {Object} criteria - Availability criteria
   * @returns {Promise<Array>} Available technicians
   */
  static async getAvailable(criteria = {}) {
    const {
      required_skills = [],
      date,
      city,
      state
    } = criteria;

    const conditions = ['is_active = true'];
    const values = [];
    let paramCount = 1;

    // Filter by required skills
    if (required_skills.length > 0) {
      conditions.push(`skills && $${paramCount}`);
      values.push(required_skills);
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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT
        t.*,
        (SELECT COUNT(*) FROM jobs j
         WHERE j.assigned_technician_id = t.id
           AND j.status IN ('to_do', 'in_progress')
           ${date ? `AND j.scheduled_date = $${paramCount}` : ''}
        ) as active_jobs_count
       FROM technicians t
       ${whereClause}
       ORDER BY active_jobs_count ASC, experience_level DESC`,
      date ? [...values, date] : values
    );

    return result.rows;
  }

  /**
   * Deactivate technician
   * @param {string} id - Technician UUID
   * @param {string} terminationDate - Termination date
   * @returns {Promise<Object>} Updated technician
   */
  static async deactivate(id, terminationDate = new Date().toISOString()) {
    return await this.update(id, {
      is_active: false,
      termination_date: terminationDate
    });
  }

  /**
   * Reactivate technician
   * @param {string} id - Technician UUID
   * @returns {Promise<Object>} Updated technician
   */
  static async reactivate(id) {
    return await this.update(id, {
      is_active: true,
      termination_date: null
    });
  }

  /**
   * Add skill to technician
   * @param {string} id - Technician UUID
   * @param {string} skill - Skill to add
   * @returns {Promise<Object>} Updated technician
   */
  static async addSkill(id, skill) {
    const technician = await this.findById(id);
    const skills = technician.skills || [];

    if (skills.includes(skill)) {
      throw badRequest('Technician already has this skill');
    }

    skills.push(skill);
    return await this.update(id, { skills });
  }

  /**
   * Remove skill from technician
   * @param {string} id - Technician UUID
   * @param {string} skill - Skill to remove
   * @returns {Promise<Object>} Updated technician
   */
  static async removeSkill(id, skill) {
    const technician = await this.findById(id);
    const skills = (technician.skills || []).filter(s => s !== skill);

    return await this.update(id, { skills });
  }

  /**
   * Get technician performance metrics
   * @param {string} id - Technician UUID
   * @param {string} startDate - Start date for metrics
   * @param {string} endDate - End date for metrics
   * @returns {Promise<Object>} Performance metrics
   */
  static async getPerformanceMetrics(id, startDate, endDate) {
    const result = await query(
      `SELECT
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as completed_jobs,
        AVG(CASE WHEN j.status = 'completed' THEN
          EXTRACT(EPOCH FROM (j.actual_end_date - j.actual_start_date)) / 3600
        END) as avg_job_duration_hours,
        SUM(te.duration_hours) as total_hours_worked,
        SUM(te.billable_hours) as total_billable_hours,
        SUM(te.total_cost) as total_revenue_generated,
        AVG(te.hourly_rate) as avg_hourly_rate
       FROM technicians t
       LEFT JOIN jobs j ON j.assigned_technician_id = t.id
         AND j.scheduled_date >= $2
         AND j.scheduled_date <= $3
       LEFT JOIN time_entries te ON te.technician_id = t.id
         AND te.clock_in >= $2
         AND te.clock_in <= $3
       WHERE t.id = $1`,
      [id, startDate, endDate]
    );

    return result.rows[0];
  }
}

export default Technician;

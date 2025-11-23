/**
 * TimeEntry Model
 * Complete CRUD operations for TimeEntry entity
 * Replaces base44.entities.TimeEntry.*
 */

import { query, transaction } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class TimeEntry {
  /**
   * Create a new time entry (clock in)
   * @param {Object} data - Time entry data
   * @returns {Promise<Object>} Created time entry
   */
  static async create(data) {
    const {
      technician_id,
      job_id,
      clock_in = new Date().toISOString(),
      clock_in_location,
      clock_in_gps,
      clock_in_method = 'manual',
      notes
    } = data;

    // Validate required fields
    if (!technician_id) {
      throw badRequest('Technician ID is required');
    }
    if (!job_id) {
      throw badRequest('Job ID is required');
    }

    // Check if technician has active time entry
    const activeEntry = await query(
      `SELECT id FROM time_entries
       WHERE technician_id = $1 AND clock_out IS NULL
       LIMIT 1`,
      [technician_id]
    );

    if (activeEntry.rows.length > 0) {
      throw badRequest('Technician already has an active time entry. Clock out first.');
    }

    const result = await query(
      `INSERT INTO time_entries (
        technician_id, job_id, clock_in, clock_in_location, clock_in_gps,
        clock_in_method, notes, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [
        technician_id, job_id, clock_in, clock_in_location,
        clock_in_gps ? JSON.stringify(clock_in_gps) : null,
        clock_in_method, notes
      ]
    );

    return result.rows[0];
  }

  /**
   * Get time entry by ID
   * @param {string} id - TimeEntry UUID
   * @returns {Promise<Object>} TimeEntry record
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM time_entries WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Time entry with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update time entry
   * @param {string} id - TimeEntry UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated time entry
   */
  static async update(id, data) {
    // First check if time entry exists
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      technician_id: 'technician_id',
      job_id: 'job_id',
      clock_in: 'clock_in',
      clock_out: 'clock_out',
      clock_in_location: 'clock_in_location',
      clock_out_location: 'clock_out_location',
      clock_in_method: 'clock_in_method',
      clock_out_method: 'clock_out_method',
      duration_hours: 'duration_hours',
      break_duration_minutes: 'break_duration_minutes',
      billable_hours: 'billable_hours',
      hourly_rate: 'hourly_rate',
      total_cost: 'total_cost',
      notes: 'notes',
      is_approved: 'is_approved',
      approved_by: 'approved_by',
      approved_at: 'approved_at'
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    // Handle GPS coordinates (needs JSON stringification)
    if (data.clock_in_gps !== undefined) {
      updates.push(`clock_in_gps = $${paramCount++}`);
      values.push(data.clock_in_gps ? JSON.stringify(data.clock_in_gps) : null);
    }

    if (data.clock_out_gps !== undefined) {
      updates.push(`clock_out_gps = $${paramCount++}`);
      values.push(data.clock_out_gps ? JSON.stringify(data.clock_out_gps) : null);
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      throw badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE time_entries
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete time entry
   * @param {string} id - TimeEntry UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const entry = await this.findById(id);

    // Don't allow deletion of approved time entries
    if (entry.is_approved) {
      throw badRequest('Cannot delete approved time entry');
    }

    await query('DELETE FROM time_entries WHERE id = $1', [id]);
    return true;
  }

  /**
   * List time entries with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Time entries and metadata
   */
  static async list(options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'clock_in',
      sortOrder = 'DESC',
      technician_id,
      job_id,
      is_approved
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (technician_id) {
      conditions.push(`technician_id = $${paramCount++}`);
      values.push(technician_id);
    }

    if (job_id) {
      conditions.push(`job_id = $${paramCount++}`);
      values.push(job_id);
    }

    if (is_approved !== undefined) {
      conditions.push(`is_approved = $${paramCount++}`);
      values.push(is_approved);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM time_entries ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    values.push(limit, offset);
    const result = await query(
      `SELECT
        te.*,
        t.first_name || ' ' || t.last_name as technician_name,
        j.job_number,
        j.title as job_title
       FROM time_entries te
       LEFT JOIN technicians t ON te.technician_id = t.id
       LEFT JOIN jobs j ON te.job_id = j.id
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
   * Filter time entries with complex conditions
   * @param {Object} filters - Filter conditions
   * @returns {Promise<Array>} Filtered time entries
   */
  static async filter(filters = {}) {
    const {
      technician_id,
      job_id,
      clock_in_after,
      clock_in_before,
      clock_out_after,
      clock_out_before,
      is_approved,
      is_active,
      min_duration,
      max_duration,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Filter by technician
    if (technician_id) {
      conditions.push(`te.technician_id = $${paramCount}`);
      values.push(technician_id);
      paramCount++;
    }

    // Filter by job
    if (job_id) {
      conditions.push(`te.job_id = $${paramCount}`);
      values.push(job_id);
      paramCount++;
    }

    // Active time entries (not clocked out)
    if (is_active) {
      conditions.push(`te.clock_out IS NULL`);
    }

    // Approval status
    if (is_approved !== undefined) {
      conditions.push(`te.is_approved = $${paramCount}`);
      values.push(is_approved);
      paramCount++;
    }

    // Clock in date filters
    if (clock_in_after) {
      conditions.push(`te.clock_in >= $${paramCount}`);
      values.push(clock_in_after);
      paramCount++;
    }

    if (clock_in_before) {
      conditions.push(`te.clock_in <= $${paramCount}`);
      values.push(clock_in_before);
      paramCount++;
    }

    // Clock out date filters
    if (clock_out_after) {
      conditions.push(`te.clock_out >= $${paramCount}`);
      values.push(clock_out_after);
      paramCount++;
    }

    if (clock_out_before) {
      conditions.push(`te.clock_out <= $${paramCount}`);
      values.push(clock_out_before);
      paramCount++;
    }

    // Duration filters
    if (min_duration !== undefined) {
      conditions.push(`te.duration_hours >= $${paramCount}`);
      values.push(min_duration);
      paramCount++;
    }

    if (max_duration !== undefined) {
      conditions.push(`te.duration_hours <= $${paramCount}`);
      values.push(max_duration);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    values.push(limit, offset);

    const result = await query(
      `SELECT
        te.*,
        t.first_name || ' ' || t.last_name as technician_name,
        j.job_number,
        j.title as job_title
       FROM time_entries te
       LEFT JOIN technicians t ON te.technician_id = t.id
       LEFT JOIN jobs j ON te.job_id = j.id
       ${whereClause}
       ORDER BY te.clock_in DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  /**
   * Clock out (end time entry)
   * @param {string} id - TimeEntry UUID
   * @param {Object} data - Clock out data
   * @returns {Promise<Object>} Updated time entry
   */
  static async clockOut(id, data = {}) {
    const entry = await this.findById(id);

    if (entry.clock_out) {
      throw badRequest('Time entry already clocked out');
    }

    const {
      clock_out = new Date().toISOString(),
      clock_out_location,
      clock_out_gps,
      clock_out_method = 'manual',
      break_duration_minutes = 0,
      notes
    } = data;

    // Calculate duration
    const clockInTime = new Date(entry.clock_in);
    const clockOutTime = new Date(clock_out);
    const durationMs = clockOutTime - clockInTime;
    const durationHours = (durationMs / (1000 * 60 * 60)) - (break_duration_minutes / 60);

    // Calculate billable hours and cost
    const billable_hours = durationHours;
    const hourly_rate = entry.hourly_rate || 0;
    const total_cost = billable_hours * hourly_rate;

    const updates = {
      clock_out,
      clock_out_location,
      clock_out_gps,
      clock_out_method,
      break_duration_minutes,
      duration_hours: durationHours,
      billable_hours,
      total_cost
    };

    if (notes) {
      updates.notes = entry.notes ? `${entry.notes}\n${notes}` : notes;
    }

    return await this.update(id, updates);
  }

  /**
   * Get active time entry for technician
   * @param {string} technicianId - Technician UUID
   * @returns {Promise<Object|null>} Active time entry or null
   */
  static async getActiveForTechnician(technicianId) {
    const result = await query(
      `SELECT
        te.*,
        j.job_number,
        j.title as job_title,
        c.name as customer_name
       FROM time_entries te
       LEFT JOIN jobs j ON te.job_id = j.id
       LEFT JOIN customers c ON j.customer_id = c.id
       WHERE te.technician_id = $1 AND te.clock_out IS NULL
       LIMIT 1`,
      [technicianId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get time entries for a date range
   * @param {string} technicianId - Technician UUID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Time entries
   */
  static async getByDateRange(technicianId, startDate, endDate) {
    const result = await query(
      `SELECT
        te.*,
        j.job_number,
        j.title as job_title,
        c.name as customer_name
       FROM time_entries te
       LEFT JOIN jobs j ON te.job_id = j.id
       LEFT JOIN customers c ON j.customer_id = c.id
       WHERE te.technician_id = $1
         AND te.clock_in >= $2
         AND te.clock_in <= $3
       ORDER BY te.clock_in DESC`,
      [technicianId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Approve time entry
   * @param {string} id - TimeEntry UUID
   * @param {string} approvedBy - User ID who approved
   * @returns {Promise<Object>} Approved time entry
   */
  static async approve(id, approvedBy) {
    const entry = await this.findById(id);

    if (!entry.clock_out) {
      throw badRequest('Cannot approve time entry that is not clocked out');
    }

    return await this.update(id, {
      is_approved: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    });
  }

  /**
   * Get total hours for technician in date range
   * @param {string} technicianId - Technician UUID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Hour totals
   */
  static async getTotalHours(technicianId, startDate, endDate) {
    const result = await query(
      `SELECT
        COUNT(*) as total_entries,
        SUM(duration_hours) as total_hours,
        SUM(billable_hours) as total_billable_hours,
        SUM(total_cost) as total_cost
       FROM time_entries
       WHERE technician_id = $1
         AND clock_in >= $2
         AND clock_in <= $3
         AND clock_out IS NOT NULL`,
      [technicianId, startDate, endDate]
    );

    const row = result.rows[0];
    return {
      total_entries: parseInt(row.total_entries) || 0,
      total_hours: parseFloat(row.total_hours) || 0,
      total_billable_hours: parseFloat(row.total_billable_hours) || 0,
      total_cost: parseFloat(row.total_cost) || 0
    };
  }

  /**
   * Get unapproved time entries
   * @returns {Promise<Array>} Unapproved time entries
   */
  static async getUnapproved() {
    const result = await query(
      `SELECT
        te.*,
        t.first_name || ' ' || t.last_name as technician_name,
        j.job_number,
        j.title as job_title
       FROM time_entries te
       LEFT JOIN technicians t ON te.technician_id = t.id
       LEFT JOIN jobs j ON te.job_id = j.id
       WHERE te.is_approved = false
         AND te.clock_out IS NOT NULL
       ORDER BY te.clock_out DESC`,
      []
    );

    return result.rows;
  }
}

export default TimeEntry;

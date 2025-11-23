/**
 * Schedule Model
 * Manages technician schedules, shifts, and availability
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Schedule {
  /**
   * Create a new schedule entry
   */
  static async create(data) {
    const {
      technician_id,
      schedule_date,
      shift_start,
      shift_end,
      schedule_type = 'regular', // regular, on_call, overtime, time_off
      status = 'scheduled', // scheduled, confirmed, cancelled
      is_available = true,
      notes = null,
      created_by = null
    } = data;

    if (!technician_id || !schedule_date) {
      throw badRequest('Technician ID and schedule date are required');
    }

    const result = await query(
      `INSERT INTO schedules (
        technician_id, schedule_date, shift_start, shift_end,
        schedule_type, status, is_available, notes, created_by,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [technician_id, schedule_date, shift_start, shift_end, schedule_type, status, is_available, notes, created_by]
    );

    return result.rows[0];
  }

  /**
   * Find schedule by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM schedules WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Schedule with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update schedule
   */
  static async update(id, data) {
    const schedule = await this.findById(id);

    const {
      shift_start = schedule.shift_start,
      shift_end = schedule.shift_end,
      schedule_type = schedule.schedule_type,
      status = schedule.status,
      is_available = schedule.is_available,
      notes = schedule.notes
    } = data;

    const result = await query(
      `UPDATE schedules SET
        shift_start = $1, shift_end = $2, schedule_type = $3,
        status = $4, is_available = $5, notes = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *`,
      [shift_start, shift_end, schedule_type, status, is_available, notes, id]
    );

    return result.rows[0];
  }

  /**
   * Delete schedule
   */
  static async delete(id) {
    await this.findById(id);

    await query('DELETE FROM schedules WHERE id = $1', [id]);

    return { success: true, message: 'Schedule deleted successfully' };
  }

  /**
   * List schedules with filters
   */
  static async list(filters = {}) {
    const {
      technician_id = null,
      start_date = null,
      end_date = null,
      schedule_type = null,
      status = null,
      is_available = null,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (technician_id) {
      conditions.push(`technician_id = $${paramCount}`);
      values.push(technician_id);
      paramCount++;
    }

    if (start_date) {
      conditions.push(`schedule_date >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`schedule_date <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (schedule_type) {
      conditions.push(`schedule_type = $${paramCount}`);
      values.push(schedule_type);
      paramCount++;
    }

    if (status) {
      conditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (is_available !== null) {
      conditions.push(`is_available = $${paramCount}`);
      values.push(is_available);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM schedules ${whereClause}
       ORDER BY schedule_date ASC, shift_start ASC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM schedules ${whereClause}`,
      values
    );

    return {
      schedules: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Get technician availability for a date range
   */
  static async getAvailability(technicianId, startDate, endDate) {
    const result = await query(
      `SELECT * FROM schedules
       WHERE technician_id = $1
       AND schedule_date BETWEEN $2 AND $3
       AND is_available = true
       AND status IN ('scheduled', 'confirmed')
       ORDER BY schedule_date ASC, shift_start ASC`,
      [technicianId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Check if technician is available at specific time
   */
  static async checkAvailability(technicianId, dateTime) {
    const result = await query(
      `SELECT * FROM schedules
       WHERE technician_id = $1
       AND schedule_date = $2::date
       AND shift_start <= $2::time
       AND shift_end >= $2::time
       AND is_available = true
       AND status IN ('scheduled', 'confirmed')`,
      [technicianId, dateTime]
    );

    return {
      available: result.rows.length > 0,
      schedule: result.rows[0] || null
    };
  }

  /**
   * Get all schedules for a specific date
   */
  static async getByDate(date, filters = {}) {
    const { technician_id = null, is_available = null } = filters;

    const conditions = ['schedule_date = $1'];
    const values = [date];
    let paramCount = 2;

    if (technician_id) {
      conditions.push(`technician_id = $${paramCount}`);
      values.push(technician_id);
      paramCount++;
    }

    if (is_available !== null) {
      conditions.push(`is_available = $${paramCount}`);
      values.push(is_available);
      paramCount++;
    }

    const result = await query(
      `SELECT s.*, t.first_name, t.last_name, t.email
       FROM schedules s
       LEFT JOIN technicians t ON s.technician_id = t.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY shift_start ASC`,
      values
    );

    return result.rows;
  }

  /**
   * Create recurring schedule
   */
  static async createRecurring(data) {
    const {
      technician_id,
      start_date,
      end_date,
      shift_start,
      shift_end,
      days_of_week, // [0, 1, 2, 3, 4] for Mon-Fri
      schedule_type = 'regular',
      created_by = null
    } = data;

    if (!technician_id || !start_date || !end_date || !days_of_week) {
      throw badRequest('Required fields missing for recurring schedule');
    }

    const createdSchedules = [];
    const currentDate = new Date(start_date);
    const endDateTime = new Date(end_date);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.getDay();

      if (days_of_week.includes(dayOfWeek)) {
        const schedule = await this.create({
          technician_id,
          schedule_date: currentDate.toISOString().split('T')[0],
          shift_start,
          shift_end,
          schedule_type,
          status: 'scheduled',
          is_available: true,
          created_by
        });

        createdSchedules.push(schedule);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: true,
      created_count: createdSchedules.length,
      schedules: createdSchedules
    };
  }

  /**
   * Get schedule conflicts
   */
  static async getConflicts(technicianId, scheduleDate, shiftStart, shiftEnd, excludeId = null) {
    const conditions = [
      'technician_id = $1',
      'schedule_date = $2',
      'status != $3',
      '(shift_start < $5 AND shift_end > $4)'
    ];
    const values = [technicianId, scheduleDate, 'cancelled', shiftStart, shiftEnd];

    if (excludeId) {
      conditions.push('id != $6');
      values.push(excludeId);
    }

    const result = await query(
      `SELECT * FROM schedules WHERE ${conditions.join(' AND ')}`,
      values
    );

    return result.rows;
  }
}

export default Schedule;

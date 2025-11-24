/**
 * MaintenanceSchedule Model
 * Manages preventive maintenance schedules for assets
 */

import pool from '../database/pool.js';

class MaintenanceSchedule {
  /**
   * Get all maintenance schedules with filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT ms.*, a.name as asset_name, t.name as technician_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      LEFT JOIN technicians t ON ms.assigned_technician_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.asset_id) {
      query += ` AND ms.asset_id = $${paramCount}`;
      params.push(filters.asset_id);
      paramCount++;
    }

    if (filters.schedule_type) {
      query += ` AND ms.schedule_type = $${paramCount}`;
      params.push(filters.schedule_type);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND ms.is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    if (filters.due_soon) {
      // Schedules due within next 7 days
      query += ` AND ms.next_maintenance_date <= NOW() + INTERVAL '7 days'`;
    }

    if (filters.overdue) {
      query += ` AND ms.next_maintenance_date < NOW()`;
    }

    query += ' ORDER BY ms.next_maintenance_date ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get maintenance schedule by ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT ms.*, a.name as asset_name, t.name as technician_name
       FROM maintenance_schedules ms
       LEFT JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN technicians t ON ms.assigned_technician_id = t.id
       WHERE ms.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get schedules by asset
   */
  static async findByAsset(assetId) {
    const result = await pool.query(
      `SELECT ms.*, t.name as technician_name
       FROM maintenance_schedules ms
       LEFT JOIN technicians t ON ms.assigned_technician_id = t.id
       WHERE ms.asset_id = $1
       ORDER BY ms.next_maintenance_date ASC`,
      [assetId]
    );
    return result.rows;
  }

  /**
   * Get overdue schedules
   */
  static async findOverdue() {
    const result = await pool.query(
      `SELECT ms.*, a.name as asset_name, t.name as technician_name
       FROM maintenance_schedules ms
       LEFT JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN technicians t ON ms.assigned_technician_id = t.id
       WHERE ms.next_maintenance_date < NOW()
       AND ms.is_active = true
       ORDER BY ms.next_maintenance_date ASC`
    );
    return result.rows;
  }

  /**
   * Get upcoming schedules
   */
  static async findUpcoming(days = 7) {
    const result = await pool.query(
      `SELECT ms.*, a.name as asset_name, t.name as technician_name
       FROM maintenance_schedules ms
       LEFT JOIN assets a ON ms.asset_id = a.id
       LEFT JOIN technicians t ON ms.assigned_technician_id = t.id
       WHERE ms.next_maintenance_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
       AND ms.is_active = true
       ORDER BY ms.next_maintenance_date ASC`
    );
    return result.rows;
  }

  /**
   * Create new maintenance schedule
   */
  static async create(data) {
    const {
      asset_id,
      schedule_type,
      frequency,
      interval_value,
      next_maintenance_date,
      assigned_technician_id,
      estimated_duration,
      notes,
      is_active
    } = data;

    const result = await pool.query(
      `INSERT INTO maintenance_schedules
       (asset_id, schedule_type, frequency, interval_value, next_maintenance_date,
        assigned_technician_id, estimated_duration, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        asset_id,
        schedule_type || 'preventive',
        frequency,
        interval_value,
        next_maintenance_date,
        assigned_technician_id,
        estimated_duration,
        notes,
        is_active !== false
      ]
    );

    return result.rows[0];
  }

  /**
   * Update maintenance schedule
   */
  static async update(id, data) {
    const {
      schedule_type,
      frequency,
      interval_value,
      next_maintenance_date,
      last_maintenance_date,
      assigned_technician_id,
      estimated_duration,
      notes,
      is_active
    } = data;

    const result = await pool.query(
      `UPDATE maintenance_schedules
       SET schedule_type = COALESCE($1, schedule_type),
           frequency = COALESCE($2, frequency),
           interval_value = COALESCE($3, interval_value),
           next_maintenance_date = COALESCE($4, next_maintenance_date),
           last_maintenance_date = COALESCE($5, last_maintenance_date),
           assigned_technician_id = COALESCE($6, assigned_technician_id),
           estimated_duration = COALESCE($7, estimated_duration),
           notes = COALESCE($8, notes),
           is_active = COALESCE($9, is_active),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        schedule_type,
        frequency,
        interval_value,
        next_maintenance_date,
        last_maintenance_date,
        assigned_technician_id,
        estimated_duration,
        notes,
        is_active,
        id
      ]
    );

    return result.rows[0];
  }

  /**
   * Complete maintenance and calculate next date
   */
  static async completeMaintenance(id) {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new Error('Maintenance schedule not found');
    }

    const now = new Date();
    const nextDate = this.calculateNextDate(now, schedule.frequency, schedule.interval_value);

    const result = await pool.query(
      `UPDATE maintenance_schedules
       SET last_maintenance_date = $1,
           next_maintenance_date = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [now, nextDate, id]
    );

    return result.rows[0];
  }

  /**
   * Calculate next maintenance date
   */
  static calculateNextDate(currentDate, frequency, intervalValue) {
    const date = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + intervalValue);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (intervalValue * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + intervalValue);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + intervalValue);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }

    return date;
  }

  /**
   * Toggle active status
   */
  static async toggleActive(id) {
    const result = await pool.query(
      `UPDATE maintenance_schedules
       SET is_active = NOT is_active,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete maintenance schedule
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM maintenance_schedules WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get maintenance statistics for asset
   */
  static async getAssetStats(assetId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_schedules,
         COUNT(*) FILTER (WHERE is_active = true) as active_schedules,
         COUNT(*) FILTER (WHERE next_maintenance_date < NOW() AND is_active = true) as overdue,
         COUNT(*) FILTER (WHERE next_maintenance_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND is_active = true) as due_soon,
         MAX(last_maintenance_date) as last_maintenance,
         MIN(next_maintenance_date) FILTER (WHERE is_active = true) as next_maintenance
       FROM maintenance_schedules
       WHERE asset_id = $1`,
      [assetId]
    );
    return result.rows[0];
  }
}

export default MaintenanceSchedule;

/**
 * GPSTracking Model
 * Complete CRUD operations for GPSTracking entity
 * Replaces base44.entities.GPSTracking.*
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class GPSTracking {
  static async create(data) {
    const {
      technician_id,
      job_id,
      latitude,
      longitude,
      accuracy,
      timestamp = new Date().toISOString(),
      tracking_type = 'manual',
      speed,
      heading,
      altitude
    } = data;

    if (!technician_id) throw badRequest('Technician ID is required');
    if (latitude === undefined || longitude === undefined) {
      throw badRequest('Latitude and longitude are required');
    }

    const result = await query(
      `INSERT INTO gps_tracking (
        technician_id, job_id, latitude, longitude, accuracy,
        timestamp, tracking_type, speed, heading, altitude, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [technician_id, job_id, latitude, longitude, accuracy, timestamp, tracking_type, speed, heading, altitude]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM gps_tracking WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`GPS tracking record with ID ${id} not found`);
    return result.rows[0];
  }

  static async getByTechnician(technicianId, startDate, endDate) {
    const result = await query(
      `SELECT * FROM gps_tracking
       WHERE technician_id = $1 AND timestamp >= $2 AND timestamp <= $3
       ORDER BY timestamp ASC`,
      [technicianId, startDate, endDate]
    );
    return result.rows;
  }

  static async getByJob(jobId) {
    const result = await query(
      `SELECT * FROM gps_tracking WHERE job_id = $1 ORDER BY timestamp ASC`,
      [jobId]
    );
    return result.rows;
  }

  static async getLatest(technicianId) {
    const result = await query(
      `SELECT * FROM gps_tracking WHERE technician_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [technicianId]
    );
    return result.rows[0] || null;
  }

  static async filter(filters = {}) {
    const { technician_id, job_id, start_date, end_date, tracking_type, limit = 1000, offset = 0 } = filters;
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
    if (start_date) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(end_date);
    }
    if (tracking_type) {
      conditions.push(`tracking_type = $${paramCount++}`);
      values.push(tracking_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM gps_tracking ${whereClause} ORDER BY timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM gps_tracking WHERE id = $1', [id]);
    return true;
  }
}

export default GPSTracking;

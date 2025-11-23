/**
 * GPSAlert Model - Geofencing alerts
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class GPSAlert {
  static async create(data) {
    const {
      gps_zone_id,
      technician_id,
      alert_type,
      lat,
      lng,
      message = null,
      metadata = {},
      is_read = false
    } = data;

    // Validation
    if (!gps_zone_id) {
      throw badRequest('GPS zone ID is required');
    }
    if (!technician_id) {
      throw badRequest('Technician ID is required');
    }
    if (!alert_type) {
      throw badRequest('Alert type is required');
    }
    if (!lat || !lng) {
      throw badRequest('Coordinates are required');
    }

    const validAlertTypes = ['entered', 'exited', 'dwelling', 'speeding'];
    if (!validAlertTypes.includes(alert_type)) {
      throw badRequest(`Invalid alert type. Must be one of: ${validAlertTypes.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO gps_alerts (gps_zone_id, technician_id, alert_type, lat, lng,
       message, metadata, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [gps_zone_id, technician_id, alert_type, lat, lng, message,
       JSON.stringify(metadata), is_read]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM gps_alerts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('GPS alert not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['is_read', 'message', 'metadata'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify objects
        if (field === 'metadata') {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
        }
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw badRequest('No valid fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE gps_alerts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM gps_alerts WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const {
      limit = 100,
      offset = 0,
      gps_zone_id = null,
      technician_id = null,
      alert_type = null,
      is_read = null,
      from_date = null,
      to_date = null
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (gps_zone_id) {
      conditions.push(`gps_zone_id = $${paramCount}`);
      values.push(gps_zone_id);
      paramCount++;
    }

    if (technician_id) {
      conditions.push(`technician_id = $${paramCount}`);
      values.push(technician_id);
      paramCount++;
    }

    if (alert_type) {
      conditions.push(`alert_type = $${paramCount}`);
      values.push(alert_type);
      paramCount++;
    }

    if (is_read !== null) {
      conditions.push(`is_read = $${paramCount}`);
      values.push(is_read);
      paramCount++;
    }

    if (from_date) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM gps_alerts ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByZone(gpsZoneId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const result = await query(
      `SELECT ga.*, t.first_name, t.last_name, t.email
       FROM gps_alerts ga
       LEFT JOIN technicians t ON ga.technician_id = t.id
       WHERE ga.gps_zone_id = $1
       ORDER BY ga.created_at DESC LIMIT $2 OFFSET $3`,
      [gpsZoneId, limit, offset]
    );

    return result.rows;
  }

  static async getByTechnician(technicianId, options = {}) {
    const { limit = 100, offset = 0, is_read = null } = options;

    const conditions = [`technician_id = $1`];
    const values = [technicianId];
    let paramCount = 2;

    if (is_read !== null) {
      conditions.push(`is_read = $${paramCount}`);
      values.push(is_read);
      paramCount++;
    }

    values.push(limit, offset);

    const result = await query(
      `SELECT ga.*, gz.name as zone_name, gz.color as zone_color
       FROM gps_alerts ga
       LEFT JOIN gps_zones gz ON ga.gps_zone_id = gz.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ga.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async markAsRead(id) {
    return await this.update(id, { is_read: true });
  }

  static async markAllAsRead(technicianId) {
    await query(
      'UPDATE gps_alerts SET is_read = true WHERE technician_id = $1 AND is_read = false',
      [technicianId]
    );
    return { success: true };
  }

  static async getUnreadCount(technicianId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM gps_alerts WHERE technician_id = $1 AND is_read = false',
      [technicianId]
    );
    return parseInt(result.rows[0].count);
  }

  static async getStats(options = {}) {
    const { from_date = null, to_date = null, gps_zone_id = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (from_date) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }

    if (gps_zone_id) {
      conditions.push(`gps_zone_id = $${paramCount}`);
      values.push(gps_zone_id);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         alert_type,
         COUNT(*) as count,
         COUNT(DISTINCT technician_id) as unique_technicians,
         COUNT(DISTINCT gps_zone_id) as unique_zones
       FROM gps_alerts
       ${whereClause}
       GROUP BY alert_type
       ORDER BY count DESC`,
      values
    );

    return result.rows;
  }
}

export default GPSAlert;

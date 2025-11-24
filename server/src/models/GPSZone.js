/**
 * GPSZone Model - Geofencing zones
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class GPSZone {
  static async create(data) {
    const {
      name,
      description = null,
      zone_type = 'circle',
      center_lat = null,
      center_lng = null,
      radius_meters = null,
      polygon_coords = [],
      color = '#3B82F6',
      is_active = true,
      customer_id = null,
      metadata = {}
    } = data;

    // Validation
    if (!name) {
      throw badRequest('Name is required');
    }

    if (zone_type === 'circle') {
      if (!center_lat || !center_lng || !radius_meters) {
        throw badRequest('Circle zones require center coordinates and radius');
      }
    } else if (zone_type === 'polygon') {
      if (!polygon_coords || polygon_coords.length < 3) {
        throw badRequest('Polygon zones require at least 3 coordinates');
      }
    }

    const result = await query(
      `INSERT INTO gps_zones (name, description, zone_type, center_lat, center_lng,
       radius_meters, polygon_coords, color, is_active, customer_id, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
      [name, description, zone_type, center_lat, center_lng, radius_meters,
       JSON.stringify(polygon_coords), color, is_active, customer_id, JSON.stringify(metadata)]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM gps_zones WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('GPS zone not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'description', 'zone_type', 'center_lat', 'center_lng',
      'radius_meters', 'polygon_coords', 'color', 'is_active', 'customer_id', 'metadata'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify arrays/objects
        if (field === 'polygon_coords' || field === 'metadata') {
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

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE gps_zones SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM gps_zones WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, is_active = null, customer_id = null, zone_type = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (customer_id) {
      conditions.push(`customer_id = $${paramCount}`);
      values.push(customer_id);
      paramCount++;
    }

    if (zone_type) {
      conditions.push(`zone_type = $${paramCount}`);
      values.push(zone_type);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM gps_zones ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getActive() {
    const result = await query('SELECT * FROM gps_zones WHERE is_active = true ORDER BY name ASC', []);
    return result.rows;
  }

  static async getByCustomer(customerId) {
    const result = await query(
      'SELECT * FROM gps_zones WHERE customer_id = $1 AND is_active = true ORDER BY name ASC',
      [customerId]
    );
    return result.rows;
  }

  static async checkPointInZone(zoneId, lat, lng) {
    const zone = await this.findById(zoneId);

    if (zone.zone_type === 'circle') {
      // Calculate distance using Haversine formula
      const R = 6371000; // Earth radius in meters
      const dLat = (lat - zone.center_lat) * Math.PI / 180;
      const dLng = (lng - zone.center_lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(zone.center_lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return {
        inside: distance <= zone.radius_meters,
        distance_meters: Math.round(distance)
      };
    } else if (zone.zone_type === 'polygon') {
      // Ray casting algorithm for point in polygon
      const polygon = zone.polygon_coords;
      let inside = false;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        const intersect = ((yi > lng) !== (yj > lng)) &&
          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }

      return { inside };
    }

    return { inside: false };
  }

  static async findZonesContainingPoint(lat, lng) {
    const zones = await this.getActive();
    const containing = [];

    for (const zone of zones) {
      const result = await this.checkPointInZone(zone.id, lat, lng);
      if (result.inside) {
        containing.push({
          ...zone,
          distance_meters: result.distance_meters || null
        });
      }
    }

    return containing;
  }
}

export default GPSZone;

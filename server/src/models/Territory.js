/**
 * Territory Model
 * Manages service territories and coverage areas
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Territory {
  /**
   * Create a new territory
   */
  static async create(data) {
    const {
      name,
      description = null,
      territory_type = 'geographic', // geographic, postal_code, custom
      coverage_area = null, // JSONB with polygon coordinates or postal codes
      assigned_technicians = [], // Array of technician IDs
      color = '#3B82F6',
      is_active = true,
      priority = 1,
      created_by = null
    } = data;

    if (!name) {
      throw badRequest('Territory name is required');
    }

    const result = await query(
      `INSERT INTO territories (
        name, description, territory_type, coverage_area,
        assigned_technicians, color, is_active, priority, created_by,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [name, description, territory_type, coverage_area, JSON.stringify(assigned_technicians), color, is_active, priority, created_by]
    );

    return result.rows[0];
  }

  /**
   * Find territory by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM territories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFound(`Territory with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update territory
   */
  static async update(id, data) {
    const territory = await this.findById(id);

    const {
      name = territory.name,
      description = territory.description,
      territory_type = territory.territory_type,
      coverage_area = territory.coverage_area,
      assigned_technicians = territory.assigned_technicians,
      color = territory.color,
      is_active = territory.is_active,
      priority = territory.priority
    } = data;

    const result = await query(
      `UPDATE territories SET
        name = $1, description = $2, territory_type = $3, coverage_area = $4,
        assigned_technicians = $5, color = $6, is_active = $7, priority = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [name, description, territory_type, coverage_area, JSON.stringify(assigned_technicians), color, is_active, priority, id]
    );

    return result.rows[0];
  }

  /**
   * Delete territory
   */
  static async delete(id) {
    await this.findById(id);

    await query('DELETE FROM territories WHERE id = $1', [id]);

    return { success: true, message: 'Territory deleted successfully' };
  }

  /**
   * List territories with filters
   */
  static async list(filters = {}) {
    const {
      is_active = null,
      territory_type = null,
      technician_id = null,
      search = null,
      limit = 100,
      offset = 0
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (territory_type) {
      conditions.push(`territory_type = $${paramCount}`);
      values.push(territory_type);
      paramCount++;
    }

    if (technician_id) {
      conditions.push(`assigned_technicians @> $${paramCount}`);
      values.push(JSON.stringify([technician_id]));
      paramCount++;
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM territories ${whereClause}
       ORDER BY priority DESC, name ASC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM territories ${whereClause}`,
      values
    );

    return {
      territories: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Assign technician to territory
   */
  static async assignTechnician(territoryId, technicianId) {
    const territory = await this.findById(territoryId);
    const assignedTechnicians = territory.assigned_technicians || [];

    if (!assignedTechnicians.includes(technicianId)) {
      assignedTechnicians.push(technicianId);

      return await this.update(territoryId, {
        assigned_technicians: assignedTechnicians
      });
    }

    return territory;
  }

  /**
   * Remove technician from territory
   */
  static async removeTechnician(territoryId, technicianId) {
    const territory = await this.findById(territoryId);
    const assignedTechnicians = territory.assigned_technicians || [];

    const updatedTechnicians = assignedTechnicians.filter(id => id !== technicianId);

    return await this.update(territoryId, {
      assigned_technicians: updatedTechnicians
    });
  }

  /**
   * Get territories for a technician
   */
  static async getByTechnician(technicianId) {
    const result = await query(
      `SELECT * FROM territories
       WHERE assigned_technicians @> $1
       AND is_active = true
       ORDER BY priority DESC, name ASC`,
      [JSON.stringify([technicianId])]
    );

    return result.rows;
  }

  /**
   * Check if location is in territory
   */
  static async checkLocationInTerritory(territoryId, lat, lng) {
    const territory = await this.findById(territoryId);

    if (territory.territory_type === 'geographic' && territory.coverage_area) {
      const polygon = territory.coverage_area.coordinates;

      if (!polygon || polygon.length === 0) {
        return { in_territory: false, territory };
      }

      // Ray casting algorithm for point-in-polygon
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat;
        const yi = polygon[i].lng;
        const xj = polygon[j].lat;
        const yj = polygon[j].lng;

        const intersect = ((yi > lng) !== (yj > lng)) &&
          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
      }

      return { in_territory: inside, territory };
    }

    return { in_territory: false, territory };
  }

  /**
   * Find territories containing a location
   */
  static async findByLocation(lat, lng) {
    const allTerritories = await query(
      `SELECT * FROM territories
       WHERE is_active = true
       AND territory_type = 'geographic'
       AND coverage_area IS NOT NULL`,
      []
    );

    const matchingTerritories = [];

    for (const territory of allTerritories.rows) {
      const check = await this.checkLocationInTerritory(territory.id, lat, lng);
      if (check.in_territory) {
        matchingTerritories.push(territory);
      }
    }

    return matchingTerritories;
  }

  /**
   * Check if postal code is in territory
   */
  static async checkPostalCodeInTerritory(territoryId, postalCode) {
    const territory = await this.findById(territoryId);

    if (territory.territory_type === 'postal_code' && territory.coverage_area) {
      const postalCodes = territory.coverage_area.postal_codes || [];
      const normalizedCode = postalCode.replace(/\s+/g, '').toUpperCase();

      const isInTerritory = postalCodes.some(code =>
        code.replace(/\s+/g, '').toUpperCase() === normalizedCode
      );

      return { in_territory: isInTerritory, territory };
    }

    return { in_territory: false, territory };
  }

  /**
   * Get territory statistics
   */
  static async getStats(territoryId) {
    const territory = await this.findById(territoryId);

    // Count jobs in territory
    const jobsResult = await query(
      `SELECT COUNT(*) as count, status
       FROM jobs
       WHERE territory_id = $1
       GROUP BY status`,
      [territoryId]
    );

    // Count customers in territory
    const customersResult = await query(
      `SELECT COUNT(*) as count FROM customers WHERE territory_id = $1`,
      [territoryId]
    );

    return {
      territory,
      technician_count: (territory.assigned_technicians || []).length,
      customer_count: parseInt(customersResult.rows[0]?.count || 0),
      jobs_by_status: jobsResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {})
    };
  }

  /**
   * Get workload by territory
   */
  static async getWorkload(filters = {}) {
    const {
      start_date = null,
      end_date = null,
      status = null
    } = filters;

    const conditions = ['t.is_active = true'];
    const values = [];
    let paramCount = 1;

    let jobConditions = [];
    if (start_date) {
      jobConditions.push(`j.scheduled_start >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      jobConditions.push(`j.scheduled_end <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (status) {
      jobConditions.push(`j.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    const jobWhereClause = jobConditions.length > 0 ? `AND ${jobConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
        t.id,
        t.name,
        t.priority,
        COUNT(DISTINCT j.id) as job_count,
        COUNT(DISTINCT CASE WHEN j.status = 'to_do' THEN j.id END) as pending_jobs,
        COUNT(DISTINCT CASE WHEN j.status = 'in_progress' THEN j.id END) as active_jobs,
        COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as completed_jobs
      FROM territories t
      LEFT JOIN jobs j ON j.territory_id = t.id ${jobWhereClause}
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.id, t.name, t.priority
      ORDER BY t.priority DESC, job_count DESC`,
      values
    );

    return result.rows;
  }
}

export default Territory;

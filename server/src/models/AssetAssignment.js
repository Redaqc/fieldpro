/**
 * AssetAssignment Model - Track asset assignments to technicians/jobs
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class AssetAssignment {
  static async create(data) {
    const {
      asset_id,
      assigned_to_type,
      assigned_to_id,
      assigned_by_user_id = null,
      assigned_date = new Date(),
      return_date = null,
      expected_return_date = null,
      status = 'active',
      notes = null,
      condition_at_assignment = 'good',
      condition_at_return = null
    } = data;

    // Validation
    if (!asset_id) {
      throw badRequest('Asset ID is required');
    }
    if (!assigned_to_type) {
      throw badRequest('Assigned to type is required');
    }
    if (!assigned_to_id) {
      throw badRequest('Assigned to ID is required');
    }

    const validAssignedToTypes = ['technician', 'job', 'customer'];
    if (!validAssignedToTypes.includes(assigned_to_type)) {
      throw badRequest(`Invalid assigned to type. Must be one of: ${validAssignedToTypes.join(', ')}`);
    }

    const validStatuses = ['active', 'returned', 'lost', 'damaged'];
    if (!validStatuses.includes(status)) {
      throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Check if asset is already assigned
    const existingAssignment = await query(
      'SELECT * FROM asset_assignments WHERE asset_id = $1 AND status = $2',
      [asset_id, 'active']
    );

    if (existingAssignment.rows.length > 0) {
      throw badRequest('Asset is already assigned');
    }

    const result = await query(
      `INSERT INTO asset_assignments (asset_id, assigned_to_type, assigned_to_id,
       assigned_by_user_id, assigned_date, return_date, expected_return_date, status,
       notes, condition_at_assignment, condition_at_return, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
      [asset_id, assigned_to_type, assigned_to_id, assigned_by_user_id, assigned_date,
       return_date, expected_return_date, status, notes, condition_at_assignment, condition_at_return]
    );

    // Update asset status
    await query('UPDATE assets SET status = $1 WHERE id = $2', ['in_use', asset_id]);

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM asset_assignments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Asset assignment not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'assigned_to_type', 'assigned_to_id', 'assigned_by_user_id', 'assigned_date',
      'return_date', 'expected_return_date', 'status', 'notes',
      'condition_at_assignment', 'condition_at_return'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw badRequest('No valid fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE asset_assignments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM asset_assignments WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const {
      limit = 100,
      offset = 0,
      asset_id = null,
      assigned_to_type = null,
      assigned_to_id = null,
      status = null
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (asset_id) {
      conditions.push(`asset_id = $${paramCount}`);
      values.push(asset_id);
      paramCount++;
    }

    if (assigned_to_type) {
      conditions.push(`assigned_to_type = $${paramCount}`);
      values.push(assigned_to_type);
      paramCount++;
    }

    if (assigned_to_id) {
      conditions.push(`assigned_to_id = $${paramCount}`);
      values.push(assigned_to_id);
      paramCount++;
    }

    if (status) {
      conditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM asset_assignments ${whereClause} ORDER BY assigned_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByAsset(assetId) {
    const result = await query(
      'SELECT * FROM asset_assignments WHERE asset_id = $1 ORDER BY assigned_date DESC',
      [assetId]
    );
    return result.rows;
  }

  static async getActiveByAsset(assetId) {
    const result = await query(
      'SELECT * FROM asset_assignments WHERE asset_id = $1 AND status = $2',
      [assetId, 'active']
    );
    return result.rows[0] || null;
  }

  static async getByAssignee(assignedToType, assignedToId, options = {}) {
    const { status = 'active', limit = 100, offset = 0 } = options;

    const conditions = ['assigned_to_type = $1', 'assigned_to_id = $2'];
    const values = [assignedToType, assignedToId];
    let paramCount = 3;

    if (status) {
      conditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    values.push(limit, offset);

    const result = await query(
      `SELECT aa.*, a.name as asset_name, a.asset_type, a.serial_number
       FROM asset_assignments aa
       LEFT JOIN assets a ON aa.asset_id = a.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY aa.assigned_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async returnAsset(id, data = {}) {
    const {
      return_date = new Date(),
      condition_at_return = 'good',
      notes = null
    } = data;

    const assignment = await this.findById(id);

    const updatedAssignment = await this.update(id, {
      return_date,
      condition_at_return,
      status: 'returned',
      notes: notes || assignment.notes
    });

    // Update asset status back to available
    await query('UPDATE assets SET status = $1 WHERE id = $2', ['available', assignment.asset_id]);

    return updatedAssignment;
  }

  static async markAsLost(id, notes = null) {
    const assignment = await this.findById(id);

    const updatedAssignment = await this.update(id, {
      status: 'lost',
      notes: notes || assignment.notes
    });

    // Update asset status
    await query('UPDATE assets SET status = $1 WHERE id = $2', ['lost', assignment.asset_id]);

    return updatedAssignment;
  }

  static async markAsDamaged(id, notes = null, conditionAtReturn = 'damaged') {
    const assignment = await this.findById(id);

    const updatedAssignment = await this.update(id, {
      status: 'damaged',
      condition_at_return: conditionAtReturn,
      notes: notes || assignment.notes
    });

    // Update asset status
    await query('UPDATE assets SET status = $1 WHERE id = $2', ['maintenance', assignment.asset_id]);

    return updatedAssignment;
  }

  static async getOverdue() {
    const result = await query(
      `SELECT aa.*, a.name as asset_name, a.asset_type
       FROM asset_assignments aa
       LEFT JOIN assets a ON aa.asset_id = a.id
       WHERE aa.status = 'active'
       AND aa.expected_return_date IS NOT NULL
       AND aa.expected_return_date < NOW()
       ORDER BY aa.expected_return_date ASC`
    );
    return result.rows;
  }
}

export default AssetAssignment;

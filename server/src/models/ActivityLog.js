/**
 * ActivityLog Model - Audit trail for entity changes
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class ActivityLog {
  static async create(data) {
    const {
      user_id,
      entity_type,
      entity_id,
      action,
      changes = {},
      ip_address = null,
      user_agent = null,
      metadata = {}
    } = data;

    // Validation
    if (!entity_type) {
      throw badRequest('Entity type is required');
    }
    if (!entity_id) {
      throw badRequest('Entity ID is required');
    }
    if (!action) {
      throw badRequest('Action is required');
    }

    const result = await query(
      `INSERT INTO activity_logs (user_id, entity_type, entity_id, action, changes,
       ip_address, user_agent, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [user_id, entity_type, entity_id, action, JSON.stringify(changes),
       ip_address, user_agent, JSON.stringify(metadata)]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM activity_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Activity log not found');
    }
    return result.rows[0];
  }

  static async list(options = {}) {
    const {
      limit = 100,
      offset = 0,
      user_id = null,
      entity_type = null,
      entity_id = null,
      action = null,
      from_date = null,
      to_date = null
    } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (user_id) {
      conditions.push(`user_id = $${paramCount}`);
      values.push(user_id);
      paramCount++;
    }

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(entity_type);
      paramCount++;
    }

    if (entity_id) {
      conditions.push(`entity_id = $${paramCount}`);
      values.push(entity_id);
      paramCount++;
    }

    if (action) {
      conditions.push(`action = $${paramCount}`);
      values.push(action);
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
      `SELECT * FROM activity_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByEntity(entityType, entityId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT * FROM activity_logs WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [entityType, entityId, limit, offset]
    );

    return result.rows;
  }

  static async getByUser(userId, options = {}) {
    const { limit = 100, offset = 0, entity_type = null } = options;

    const conditions = [`user_id = $1`];
    const values = [userId];
    let paramCount = 2;

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(entity_type);
      paramCount++;
    }

    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM activity_logs WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getRecentActivity(options = {}) {
    const { limit = 100, entity_type = null, action = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(entity_type);
      paramCount++;
    }

    if (action) {
      conditions.push(`action = $${paramCount}`);
      values.push(action);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit);

    const result = await query(
      `SELECT al.*, u.email as user_email, u.name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC LIMIT $${paramCount}`,
      values
    );

    return result.rows;
  }

  static async getStats(options = {}) {
    const { from_date = null, to_date = null, entity_type = null } = options;

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

    if (entity_type) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(entity_type);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         action,
         entity_type,
         COUNT(*) as count,
         COUNT(DISTINCT user_id) as unique_users,
         COUNT(DISTINCT entity_id) as unique_entities
       FROM activity_logs
       ${whereClause}
       GROUP BY action, entity_type
       ORDER BY count DESC`,
      values
    );

    return result.rows;
  }

  static async logCreate(entityType, entityId, data, userId = null, req = null) {
    return await this.create({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action: 'create',
      changes: { new: data },
      ip_address: req?.ip || null,
      user_agent: req?.get('user-agent') || null
    });
  }

  static async logUpdate(entityType, entityId, oldData, newData, userId = null, req = null) {
    return await this.create({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action: 'update',
      changes: { old: oldData, new: newData },
      ip_address: req?.ip || null,
      user_agent: req?.get('user-agent') || null
    });
  }

  static async logDelete(entityType, entityId, data, userId = null, req = null) {
    return await this.create({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action: 'delete',
      changes: { old: data },
      ip_address: req?.ip || null,
      user_agent: req?.get('user-agent') || null
    });
  }
}

export default ActivityLog;

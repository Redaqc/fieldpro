/**
 * PushSubscription Model - Web push notification subscriptions
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class PushSubscription {
  static async create(data) {
    const {
      user_id,
      endpoint,
      keys,
      device_type = 'web',
      user_agent = null,
      is_active = true
    } = data;

    // Validation
    if (!user_id) {
      throw badRequest('User ID is required');
    }
    if (!endpoint) {
      throw badRequest('Endpoint is required');
    }
    if (!keys || !keys.p256dh || !keys.auth) {
      throw badRequest('Keys (p256dh and auth) are required');
    }

    // Check if subscription already exists
    const existing = await query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [user_id, endpoint]
    );

    if (existing.rows.length > 0) {
      // Update existing subscription
      return await this.update(existing.rows[0].id, { keys, is_active: true, user_agent });
    }

    const result = await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys, device_type, user_agent, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [user_id, endpoint, JSON.stringify(keys), device_type, user_agent, is_active]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM push_subscriptions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Push subscription not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['endpoint', 'keys', 'device_type', 'user_agent', 'is_active'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify keys object
        if (field === 'keys') {
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
      `UPDATE push_subscriptions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM push_subscriptions WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, user_id = null, is_active = null, device_type = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (user_id) {
      conditions.push(`user_id = $${paramCount}`);
      values.push(user_id);
      paramCount++;
    }

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (device_type) {
      conditions.push(`device_type = $${paramCount}`);
      values.push(device_type);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM push_subscriptions ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByUser(userId) {
    const result = await query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async deleteByEndpoint(endpoint) {
    const result = await query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 RETURNING *',
      [endpoint]
    );
    return result.rows[0] || null;
  }

  static async deleteByUser(userId) {
    await query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
    return { success: true };
  }

  static async deactivate(id) {
    return await this.update(id, { is_active: false });
  }

  static async deactivateByEndpoint(endpoint) {
    const result = await query(
      'UPDATE push_subscriptions SET is_active = false, updated_at = NOW() WHERE endpoint = $1 RETURNING *',
      [endpoint]
    );
    return result.rows[0] || null;
  }

  static async getActiveCount(userId = null) {
    let queryText = 'SELECT COUNT(*) as count FROM push_subscriptions WHERE is_active = true';
    const values = [];

    if (userId) {
      queryText += ' AND user_id = $1';
      values.push(userId);
    }

    const result = await query(queryText, values);
    return parseInt(result.rows[0].count);
  }

  static async cleanupInactive(daysOld = 30) {
    // Delete subscriptions that have been inactive for X days
    const result = await query(
      `DELETE FROM push_subscriptions
       WHERE is_active = false
       AND updated_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING *`
    );
    return {
      success: true,
      deleted_count: result.rows.length
    };
  }
}

export default PushSubscription;

/**
 * Alert Model
 * Manages system alerts and critical notifications
 */

import pool from '../database/pool.js';

class Alert {
  /**
   * Get all alerts with filters
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.user_id);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.is_read !== undefined) {
      query += ` AND is_read = $${paramCount}`;
      params.push(filters.is_read);
      paramCount++;
    }

    if (filters.is_dismissed !== undefined) {
      query += ` AND is_dismissed = $${paramCount}`;
      params.push(filters.is_dismissed);
      paramCount++;
    }

    // Filter out expired alerts
    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get alert by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM alerts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM alerts
       WHERE user_id = $1
       AND is_read = false
       AND is_dismissed = false
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get alerts by entity
   */
  static async findByEntity(entityType, entityId) {
    const result = await pool.query(
      `SELECT * FROM alerts
       WHERE entity_type = $1 AND entity_id = $2
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC`,
      [entityType, entityId]
    );
    return result.rows;
  }

  /**
   * Create new alert
   */
  static async create(data) {
    const {
      type,
      title,
      message,
      entity_type,
      entity_id,
      user_id,
      action_url,
      expires_at
    } = data;

    const result = await pool.query(
      `INSERT INTO alerts
       (type, title, message, entity_type, entity_id, user_id, action_url, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [type, title, message, entity_type, entity_id, user_id, action_url, expires_at]
    );

    return result.rows[0];
  }

  /**
   * Create bulk alerts (for multiple users)
   */
  static async createBulk(userIds, alertData) {
    const { type, title, message, entity_type, entity_id, action_url, expires_at } = alertData;

    const values = userIds.map((userId, index) => {
      const offset = index * 8;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
    }).join(', ');

    const params = userIds.flatMap(userId => [
      type, title, message, entity_type, entity_id, userId, action_url, expires_at
    ]);

    const result = await pool.query(
      `INSERT INTO alerts
       (type, title, message, entity_type, entity_id, user_id, action_url, expires_at)
       VALUES ${values}
       RETURNING *`,
      params
    );

    return result.rows;
  }

  /**
   * Mark alert as read
   */
  static async markAsRead(id) {
    const result = await pool.query(
      'UPDATE alerts SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Mark all alerts as read for user
   */
  static async markAllAsRead(userId) {
    const result = await pool.query(
      'UPDATE alerts SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING *',
      [userId]
    );
    return result.rows;
  }

  /**
   * Dismiss alert
   */
  static async dismiss(id) {
    const result = await pool.query(
      'UPDATE alerts SET is_dismissed = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete alert
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM alerts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete expired alerts
   */
  static async deleteExpired() {
    const result = await pool.query(
      'DELETE FROM alerts WHERE expires_at IS NOT NULL AND expires_at < NOW() RETURNING *'
    );
    return result.rows;
  }

  /**
   * Create critical alert (SLA breach, system error, etc.)
   */
  static async createCritical(userId, title, message, entityType = null, entityId = null) {
    return await this.create({
      type: 'critical',
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      expires_at: null // Critical alerts don't expire
    });
  }

  /**
   * Create warning alert
   */
  static async createWarning(userId, title, message, expiresInHours = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return await this.create({
      type: 'warning',
      title,
      message,
      user_id: userId,
      expires_at: expiresAt
    });
  }

  /**
   * Create info alert
   */
  static async createInfo(userId, title, message, expiresInHours = 48) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return await this.create({
      type: 'info',
      title,
      message,
      user_id: userId,
      expires_at: expiresAt
    });
  }
}

export default Alert;

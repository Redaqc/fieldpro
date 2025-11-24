/**
 * Notification Model
 * Complete CRUD operations for Notification entity
 * Replaces base44.entities.Notification.*
 */

import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class Notification {
  static async create(data) {
    const {
      user_id,
      title,
      message,
      type = 'info',
      priority = 'normal',
      action_url,
      action_label,
      is_read = false,
      metadata = {}
    } = data;

    if (!user_id) throw badRequest('User ID is required');
    if (!title || !message) throw badRequest('Title and message are required');

    const validTypes = ['info', 'success', 'warning', 'error', 'job', 'payment', 'system'];
    if (!validTypes.includes(type)) {
      throw badRequest(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO notifications (
        user_id, title, message, type, priority, action_url, action_label,
        is_read, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [user_id, title, message, type, priority, action_url, action_label, is_read, metadata]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`Notification with ID ${id} not found`);
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = ['title', 'message', 'type', 'priority', 'action_url', 'action_label', 'is_read', 'read_at', 'metadata'];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });

    if (updates.length === 0) throw badRequest('No fields to update');

    values.push(id);

    const result = await query(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    return true;
  }

  static async getByUser(userId, options = {}) {
    const { limit = 50, offset = 0, is_read, type } = options;
    const conditions = ['user_id = $1'];
    const values = [userId];
    let paramCount = 2;

    if (is_read !== undefined) {
      conditions.push(`is_read = $${paramCount++}`);
      values.push(is_read);
    }
    if (type) {
      conditions.push(`type = $${paramCount++}`);
      values.push(type);
    }

    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM notifications
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    return result.rows;
  }

  static async markAsRead(id) {
    return await this.update(id, {
      is_read: true,
      read_at: new Date().toISOString()
    });
  }

  static async markAllAsRead(userId) {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return true;
  }

  static async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  static async deleteAllRead(userId) {
    await query('DELETE FROM notifications WHERE user_id = $1 AND is_read = true', [userId]);
    return true;
  }
}

export default Notification;

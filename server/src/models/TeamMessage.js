/**
 * TeamMessage Model
 * Manages internal team chat and messaging
 */

import pool from '../database/pool.js';

class TeamMessage {
  /**
   * Get all messages for a conversation
   */
  static async findByConversation(conversationId, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT tm.*, u.name as sender_name, u.email as sender_email
       FROM team_messages tm
       LEFT JOIN users u ON tm.sender_id = u.id
       WHERE tm.conversation_id = $1
       ORDER BY tm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    return result.rows.reverse(); // Return in chronological order
  }

  /**
   * Get message by ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT tm.*, u.name as sender_name, u.email as sender_email
       FROM team_messages tm
       LEFT JOIN users u ON tm.sender_id = u.id
       WHERE tm.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get unread messages for user
   */
  static async findUnreadForUser(userId, conversationId = null) {
    let query = `
      SELECT tm.*, u.name as sender_name
      FROM team_messages tm
      LEFT JOIN users u ON tm.sender_id = u.id
      WHERE tm.is_read = false
      AND tm.sender_id != $1
    `;
    const params = [userId];

    if (conversationId) {
      query += ' AND tm.conversation_id = $2';
      params.push(conversationId);
    }

    query += ' ORDER BY tm.created_at ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId, conversationId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM team_messages
      WHERE is_read = false
      AND sender_id != $1
    `;
    const params = [userId];

    if (conversationId) {
      query += ' AND conversation_id = $2';
      params.push(conversationId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get conversations for user
   */
  static async findConversations(userId) {
    const result = await pool.query(
      `SELECT DISTINCT ON (conversation_id)
         conversation_id,
         MAX(created_at) as last_message_at,
         COUNT(*) FILTER (WHERE is_read = false AND sender_id != $1) as unread_count
       FROM team_messages
       WHERE conversation_id IN (
         SELECT DISTINCT conversation_id
         FROM team_messages
         WHERE sender_id = $1
         OR conversation_id LIKE '%_${userId}' OR conversation_id LIKE '${userId}_%'
       )
       GROUP BY conversation_id
       ORDER BY conversation_id, last_message_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Search messages
   */
  static async search(query, conversationId = null, limit = 50) {
    let sql = `
      SELECT tm.*, u.name as sender_name
      FROM team_messages tm
      LEFT JOIN users u ON tm.sender_id = u.id
      WHERE tm.message ILIKE $1
    `;
    const params = [`%${query}%`];

    if (conversationId) {
      sql += ' AND tm.conversation_id = $2';
      params.push(conversationId);
    }

    sql += ` ORDER BY tm.created_at DESC LIMIT ${limit}`;

    const result = await pool.query(sql, params);
    return result.rows;
  }

  /**
   * Create new message
   */
  static async create(data) {
    const {
      conversation_id,
      sender_id,
      message,
      attachments,
      parent_message_id
    } = data;

    const result = await pool.query(
      `INSERT INTO team_messages
       (conversation_id, sender_id, message, attachments, parent_message_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [conversation_id, sender_id, message, attachments || [], parent_message_id]
    );

    return result.rows[0];
  }

  /**
   * Send message to conversation
   */
  static async send(conversationId, senderId, message, attachments = []) {
    return await this.create({
      conversation_id: conversationId,
      sender_id: senderId,
      message,
      attachments
    });
  }

  /**
   * Reply to message
   */
  static async reply(parentMessageId, senderId, message) {
    const parentMessage = await this.findById(parentMessageId);
    if (!parentMessage) {
      throw new Error('Parent message not found');
    }

    return await this.create({
      conversation_id: parentMessage.conversation_id,
      sender_id: senderId,
      message,
      parent_message_id: parentMessageId
    });
  }

  /**
   * Update message
   */
  static async update(id, data) {
    const { message, attachments } = data;

    const result = await pool.query(
      `UPDATE team_messages
       SET message = COALESCE($1, message),
           attachments = COALESCE($2, attachments),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [message, attachments, id]
    );

    return result.rows[0];
  }

  /**
   * Mark message as read
   */
  static async markAsRead(id) {
    const result = await pool.query(
      'UPDATE team_messages SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Mark all messages in conversation as read
   */
  static async markConversationAsRead(conversationId, userId) {
    const result = await pool.query(
      `UPDATE team_messages
       SET is_read = true
       WHERE conversation_id = $1
       AND sender_id != $2
       AND is_read = false
       RETURNING *`,
      [conversationId, userId]
    );
    return result.rows;
  }

  /**
   * Delete message
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM team_messages WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(conversationId) {
    const result = await pool.query(
      'DELETE FROM team_messages WHERE conversation_id = $1 RETURNING *',
      [conversationId]
    );
    return result.rows;
  }

  /**
   * Get message thread (parent + replies)
   */
  static async getThread(parentMessageId) {
    const result = await pool.query(
      `SELECT tm.*, u.name as sender_name
       FROM team_messages tm
       LEFT JOIN users u ON tm.sender_id = u.id
       WHERE tm.id = $1 OR tm.parent_message_id = $1
       ORDER BY tm.created_at ASC`,
      [parentMessageId]
    );
    return result.rows;
  }

  /**
   * Create conversation ID from user IDs
   */
  static createConversationId(userId1, userId2) {
    const ids = [userId1, userId2].sort((a, b) => a - b);
    return `${ids[0]}_${ids[1]}`;
  }

  /**
   * Create group conversation ID
   */
  static createGroupConversationId(userIds) {
    const sortedIds = [...userIds].sort((a, b) => a - b);
    return `group_${sortedIds.join('_')}`;
  }

  /**
   * Get conversation statistics
   */
  static async getConversationStats(conversationId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_messages,
         COUNT(DISTINCT sender_id) as participants,
         MAX(created_at) as last_message_at,
         MIN(created_at) as first_message_at,
         COUNT(*) FILTER (WHERE is_read = false) as unread_messages
       FROM team_messages
       WHERE conversation_id = $1`,
      [conversationId]
    );
    return result.rows[0];
  }
}

export default TeamMessage;

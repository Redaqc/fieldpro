/**
 * SyncLog Model
 * Manages integration synchronization logs and audit trail
 */

import pool from '../database/pool.js';

class SyncLog {
  /**
   * Get all sync logs with filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT sl.*, u.name as created_by_name
      FROM sync_logs sl
      LEFT JOIN users u ON sl.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.integration_type) {
      query += ` AND sl.integration_type = $${paramCount}`;
      params.push(filters.integration_type);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND sl.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.sync_type) {
      query += ` AND sl.sync_type = $${paramCount}`;
      params.push(filters.sync_type);
      paramCount++;
    }

    if (filters.start_date) {
      query += ` AND sl.started_at >= $${paramCount}`;
      params.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query += ` AND sl.started_at <= $${paramCount}`;
      params.push(filters.end_date);
      paramCount++;
    }

    query += ' ORDER BY sl.created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get sync log by ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT sl.*, u.name as created_by_name
       FROM sync_logs sl
       LEFT JOIN users u ON sl.created_by = u.id
       WHERE sl.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get latest sync for integration
   */
  static async findLatestForIntegration(integrationType) {
    const result = await pool.query(
      `SELECT sl.*, u.name as created_by_name
       FROM sync_logs sl
       LEFT JOIN users u ON sl.created_by = u.id
       WHERE sl.integration_type = $1
       ORDER BY sl.created_at DESC
       LIMIT 1`,
      [integrationType]
    );
    return result.rows[0];
  }

  /**
   * Get failed syncs
   */
  static async findFailed(integrationType = null) {
    let query = `
      SELECT sl.*, u.name as created_by_name
      FROM sync_logs sl
      LEFT JOIN users u ON sl.created_by = u.id
      WHERE sl.status IN ('failed', 'partial')
    `;
    const params = [];

    if (integrationType) {
      query += ' AND sl.integration_type = $1';
      params.push(integrationType);
    }

    query += ' ORDER BY sl.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Create new sync log
   */
  static async create(data) {
    const {
      integration_type,
      sync_type,
      status,
      records_synced,
      records_failed,
      error_message,
      started_at,
      completed_at,
      created_by
    } = data;

    const result = await pool.query(
      `INSERT INTO sync_logs
       (integration_type, sync_type, status, records_synced, records_failed,
        error_message, started_at, completed_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        integration_type,
        sync_type || 'manual',
        status || 'running',
        records_synced || 0,
        records_failed || 0,
        error_message,
        started_at || new Date(),
        completed_at,
        created_by
      ]
    );

    return result.rows[0];
  }

  /**
   * Start a new sync
   */
  static async startSync(integrationType, syncType = 'manual', userId = null) {
    return await this.create({
      integration_type: integrationType,
      sync_type: syncType,
      status: 'running',
      started_at: new Date(),
      created_by: userId
    });
  }

  /**
   * Complete sync successfully
   */
  static async completeSync(id, recordsSynced = 0, recordsFailed = 0) {
    const status = recordsFailed > 0 ? 'partial' : 'success';

    const result = await pool.query(
      `UPDATE sync_logs
       SET status = $1,
           records_synced = $2,
           records_failed = $3,
           completed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, recordsSynced, recordsFailed, id]
    );

    return result.rows[0];
  }

  /**
   * Fail sync
   */
  static async failSync(id, errorMessage, recordsSynced = 0, recordsFailed = 0) {
    const result = await pool.query(
      `UPDATE sync_logs
       SET status = 'failed',
           error_message = $1,
           records_synced = $2,
           records_failed = $3,
           completed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [errorMessage, recordsSynced, recordsFailed, id]
    );

    return result.rows[0];
  }

  /**
   * Update sync progress
   */
  static async updateProgress(id, recordsSynced, recordsFailed = 0) {
    const result = await pool.query(
      `UPDATE sync_logs
       SET records_synced = $1,
           records_failed = $2
       WHERE id = $3
       RETURNING *`,
      [recordsSynced, recordsFailed, id]
    );

    return result.rows[0];
  }

  /**
   * Delete sync log
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM sync_logs WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete old logs (retention policy)
   */
  static async deleteOlderThan(days = 90) {
    const result = await pool.query(
      `DELETE FROM sync_logs
       WHERE created_at < NOW() - INTERVAL '${days} days'
       RETURNING *`
    );
    return result.rows;
  }

  /**
   * Get sync statistics
   */
  static async getStats(integrationType = null) {
    let query = `
      SELECT
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'partial') as partial,
        COUNT(*) FILTER (WHERE status = 'running') as running,
        SUM(records_synced) as total_records_synced,
        SUM(records_failed) as total_records_failed,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
      FROM sync_logs
      WHERE 1=1
    `;
    const params = [];

    if (integrationType) {
      query += ' AND integration_type = $1';
      params.push(integrationType);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get sync history chart data
   */
  static async getHistoryChartData(integrationType, days = 30) {
    const result = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'success') as successful,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         SUM(records_synced) as records_synced
       FROM sync_logs
       WHERE integration_type = $1
       AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [integrationType]
    );
    return result.rows;
  }
}

export default SyncLog;

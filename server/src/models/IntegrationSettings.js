/**
 * IntegrationSettings Model
 * Manages third-party integration configurations
 */

import pool from '../database/pool.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ALGORITHM = 'aes-256-cbc';

class IntegrationSettings {
  /**
   * Encrypt sensitive credentials
   */
  static encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt sensitive credentials
   */
  static decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Get all integration settings
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM integration_settings WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.user_id);
      paramCount++;
    }

    if (filters.integration_type) {
      query += ` AND integration_type = $${paramCount}`;
      params.push(filters.integration_type);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    // Don't return encrypted credentials in list
    return result.rows.map(row => ({
      ...row,
      credentials_encrypted: row.credentials_encrypted ? '***' : null
    }));
  }

  /**
   * Get integration settings by ID
   */
  static async findById(id, includeCredentials = false) {
    const result = await pool.query(
      'SELECT * FROM integration_settings WHERE id = $1',
      [id]
    );

    const settings = result.rows[0];
    if (!settings) return null;

    if (includeCredentials && settings.credentials_encrypted) {
      try {
        settings.credentials = JSON.parse(this.decrypt(settings.credentials_encrypted));
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
      }
    } else {
      settings.credentials_encrypted = settings.credentials_encrypted ? '***' : null;
    }

    return settings;
  }

  /**
   * Get integration settings by type and user
   */
  static async findByTypeAndUser(integrationType, userId) {
    const result = await pool.query(
      'SELECT * FROM integration_settings WHERE integration_type = $1 AND user_id = $2',
      [integrationType, userId]
    );

    return result.rows[0];
  }

  /**
   * Create new integration settings
   */
  static async create(data) {
    const {
      integration_type,
      user_id,
      company_id,
      settings,
      credentials,
      is_active
    } = data;

    const credentialsEncrypted = credentials
      ? this.encrypt(JSON.stringify(credentials))
      : null;

    const result = await pool.query(
      `INSERT INTO integration_settings
       (integration_type, user_id, company_id, settings, credentials_encrypted, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [integration_type, user_id, company_id, settings || {}, credentialsEncrypted, is_active !== false]
    );

    const created = result.rows[0];
    created.credentials_encrypted = created.credentials_encrypted ? '***' : null;

    return created;
  }

  /**
   * Update integration settings
   */
  static async update(id, data) {
    const { settings, credentials, is_active, last_sync_at } = data;

    const credentialsEncrypted = credentials
      ? this.encrypt(JSON.stringify(credentials))
      : undefined;

    const result = await pool.query(
      `UPDATE integration_settings
       SET settings = COALESCE($1, settings),
           credentials_encrypted = COALESCE($2, credentials_encrypted),
           is_active = COALESCE($3, is_active),
           last_sync_at = COALESCE($4, last_sync_at),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [settings, credentialsEncrypted, is_active, last_sync_at, id]
    );

    const updated = result.rows[0];
    if (updated) {
      updated.credentials_encrypted = updated.credentials_encrypted ? '***' : null;
    }

    return updated;
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(id) {
    const result = await pool.query(
      `UPDATE integration_settings
       SET last_sync_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Delete integration settings
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM integration_settings WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  /**
   * Toggle active status
   */
  static async toggleActive(id) {
    const result = await pool.query(
      `UPDATE integration_settings
       SET is_active = NOT is_active,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0];
  }
}

export default IntegrationSettings;

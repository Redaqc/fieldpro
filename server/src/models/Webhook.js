/**
 * Webhook Model - Webhook endpoints for integrations
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';
import axios from 'axios';

export class Webhook {
  static async create(data) {
    const {
      name,
      url,
      event_types = [],
      is_active = true,
      secret = null,
      headers = {},
      retry_count = 3,
      timeout_seconds = 30
    } = data;

    // Validation
    if (!name) {
      throw badRequest('Name is required');
    }
    if (!url) {
      throw badRequest('URL is required');
    }
    if (!event_types || event_types.length === 0) {
      throw badRequest('At least one event type is required');
    }

    const result = await query(
      `INSERT INTO webhooks (name, url, event_types, is_active, secret, headers,
       retry_count, timeout_seconds, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
      [name, url, JSON.stringify(event_types), is_active, secret,
       JSON.stringify(headers), retry_count, timeout_seconds]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM webhooks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Webhook not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'url', 'event_types', 'is_active', 'secret',
      'headers', 'retry_count', 'timeout_seconds'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify arrays/objects
        if (field === 'event_types' || field === 'headers') {
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
      `UPDATE webhooks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM webhooks WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, is_active = null, event_type = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (event_type) {
      conditions.push(`event_types @> $${paramCount}`);
      values.push(JSON.stringify([event_type]));
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM webhooks ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByEventType(eventType) {
    const result = await query(
      `SELECT * FROM webhooks WHERE event_types @> $1 AND is_active = true`,
      [JSON.stringify([eventType])]
    );
    return result.rows;
  }

  static async trigger(webhookId, payload) {
    const webhook = await this.findById(webhookId);

    if (!webhook.is_active) {
      throw badRequest('Webhook is not active');
    }

    let attempt = 0;
    let lastError = null;

    while (attempt < webhook.retry_count) {
      try {
        const response = await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret || '',
            ...webhook.headers
          },
          timeout: webhook.timeout_seconds * 1000
        });

        // Log success
        await query(
          `INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status,
           response_body, success, attempt, created_at)
           VALUES ($1, $2, $3, $4, $5, true, $6, NOW())`,
          [webhookId, payload.event_type, JSON.stringify(payload),
           response.status, JSON.stringify(response.data), attempt + 1]
        );

        return {
          success: true,
          status: response.status,
          data: response.data
        };
      } catch (error) {
        lastError = error;
        attempt++;

        // Log failure
        await query(
          `INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status,
           error_message, success, attempt, created_at)
           VALUES ($1, $2, $3, $4, $5, false, $6, NOW())`,
          [webhookId, payload.event_type, JSON.stringify(payload),
           error.response?.status || null, error.message, attempt]
        );

        if (attempt < webhook.retry_count) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Webhook failed after all retries'
    };
  }

  static async triggerEvent(eventType, payload) {
    const webhooks = await this.getByEventType(eventType);
    const results = [];

    for (const webhook of webhooks) {
      const result = await this.trigger(webhook.id, {
        event_type: eventType,
        ...payload,
        timestamp: new Date().toISOString()
      });
      results.push({
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        ...result
      });
    }

    return results;
  }
}

export default Webhook;

/**
 * NotificationTemplate Model - Templates for notifications
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class NotificationTemplate {
  static async create(data) {
    const {
      name,
      template_type,
      channel,
      subject = null,
      body,
      variables = [],
      is_active = true,
      event_trigger = null,
      metadata = {}
    } = data;

    // Validation
    if (!name) {
      throw badRequest('Name is required');
    }
    if (!template_type) {
      throw badRequest('Template type is required');
    }
    if (!channel) {
      throw badRequest('Channel is required');
    }
    if (!body) {
      throw badRequest('Body is required');
    }

    const validChannels = ['email', 'sms', 'push', 'in_app'];
    if (!validChannels.includes(channel)) {
      throw badRequest(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO notification_templates (name, template_type, channel, subject, body,
       variables, is_active, event_trigger, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [name, template_type, channel, subject, body, JSON.stringify(variables),
       is_active, event_trigger, JSON.stringify(metadata)]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM notification_templates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Notification template not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'template_type', 'channel', 'subject', 'body',
      'variables', 'is_active', 'event_trigger', 'metadata'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify arrays/objects
        if (field === 'variables' || field === 'metadata') {
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
      `UPDATE notification_templates SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM notification_templates WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, channel = null, template_type = null, is_active = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (channel) {
      conditions.push(`channel = $${paramCount}`);
      values.push(channel);
      paramCount++;
    }

    if (template_type) {
      conditions.push(`template_type = $${paramCount}`);
      values.push(template_type);
      paramCount++;
    }

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM notification_templates ${whereClause} ORDER BY name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByType(templateType, channel = null) {
    const conditions = ['template_type = $1', 'is_active = true'];
    const values = [templateType];
    let paramCount = 2;

    if (channel) {
      conditions.push(`channel = $${paramCount}`);
      values.push(channel);
      paramCount++;
    }

    const result = await query(
      `SELECT * FROM notification_templates WHERE ${conditions.join(' AND ')}`,
      values
    );

    return result.rows;
  }

  static async getByEvent(eventTrigger, channel = null) {
    const conditions = ['event_trigger = $1', 'is_active = true'];
    const values = [eventTrigger];
    let paramCount = 2;

    if (channel) {
      conditions.push(`channel = $${paramCount}`);
      values.push(channel);
      paramCount++;
    }

    const result = await query(
      `SELECT * FROM notification_templates WHERE ${conditions.join(' AND ')}`,
      values
    );

    return result.rows;
  }

  static async render(templateId, variables = {}) {
    const template = await this.findById(templateId);

    let renderedSubject = template.subject || '';
    let renderedBody = template.body;

    // Replace variables in subject and body
    // Variables format: {variable_name}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      renderedSubject = renderedSubject.replace(regex, value);
      renderedBody = renderedBody.replace(regex, value);
    }

    return {
      subject: renderedSubject,
      body: renderedBody,
      channel: template.channel
    };
  }

  static async renderByType(templateType, channel, variables = {}) {
    const templates = await this.getByType(templateType, channel);

    if (templates.length === 0) {
      throw notFound(`No active template found for type: ${templateType}, channel: ${channel}`);
    }

    const template = templates[0];
    return await this.render(template.id, variables);
  }
}

export default NotificationTemplate;

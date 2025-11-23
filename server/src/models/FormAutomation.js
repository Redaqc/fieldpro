/**
 * FormAutomation Model - Automation rules for form submissions
 */
import { query } from '../database/config.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

export class FormAutomation {
  static async create(data) {
    const {
      template_id,
      trigger_field,
      trigger_value,
      action_type,
      action_config = {},
      is_active = true
    } = data;

    // Validation
    if (!template_id) {
      throw badRequest('Template ID is required');
    }
    if (!trigger_field) {
      throw badRequest('Trigger field is required');
    }
    if (!action_type) {
      throw badRequest('Action type is required');
    }

    const validActionTypes = ['send_email', 'send_sms', 'create_job', 'assign_technician', 'update_status', 'webhook'];
    if (!validActionTypes.includes(action_type)) {
      throw badRequest(`Invalid action type. Must be one of: ${validActionTypes.join(', ')}`);
    }

    const result = await query(
      `INSERT INTO form_automations (template_id, trigger_field, trigger_value, action_type, action_config, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [template_id, trigger_field, trigger_value, action_type, JSON.stringify(action_config), is_active]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM form_automations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw notFound('Form automation not found');
    }
    return result.rows[0];
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['template_id', 'trigger_field', 'trigger_value', 'action_type', 'action_config', 'is_active'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        // JSON stringify action_config
        if (field === 'action_config') {
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

    values.push(id);

    const result = await query(
      `UPDATE form_automations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM form_automations WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, template_id = null, is_active = null, action_type = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (template_id) {
      conditions.push(`template_id = $${paramCount}`);
      values.push(template_id);
      paramCount++;
    }

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (action_type) {
      conditions.push(`action_type = $${paramCount}`);
      values.push(action_type);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM form_automations ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async getByTemplate(templateId) {
    const result = await query(
      'SELECT * FROM form_automations WHERE template_id = $1 AND is_active = true ORDER BY created_at ASC',
      [templateId]
    );
    return result.rows;
  }

  static async trigger(automationId, formData) {
    const automation = await this.findById(automationId);

    if (!automation.is_active) {
      throw badRequest('Automation is not active');
    }

    // Check if trigger condition is met
    const fieldValue = formData[automation.trigger_field];

    if (automation.trigger_value && fieldValue !== automation.trigger_value) {
      return { triggered: false, reason: 'Trigger condition not met' };
    }

    // Execute action based on action_type
    const actionConfig = automation.action_config;

    switch (automation.action_type) {
      case 'send_email':
        // Would integrate with email service
        console.log('Send email:', actionConfig);
        break;

      case 'send_sms':
        // Would integrate with SMS service
        console.log('Send SMS:', actionConfig);
        break;

      case 'create_job':
        // Would create a job using Job model
        console.log('Create job:', actionConfig);
        break;

      case 'assign_technician':
        // Would assign technician
        console.log('Assign technician:', actionConfig);
        break;

      case 'update_status':
        // Would update entity status
        console.log('Update status:', actionConfig);
        break;

      case 'webhook':
        // Would call webhook
        console.log('Call webhook:', actionConfig);
        break;

      default:
        throw badRequest(`Unknown action type: ${automation.action_type}`);
    }

    return {
      triggered: true,
      automation_id: automationId,
      action_type: automation.action_type,
      executed_at: new Date()
    };
  }

  static async processFormSubmission(templateId, formData) {
    const automations = await this.getByTemplate(templateId);
    const results = [];

    for (const automation of automations) {
      try {
        const result = await this.trigger(automation.id, formData);
        if (result.triggered) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Automation ${automation.id} failed:`, error);
        results.push({
          triggered: false,
          automation_id: automation.id,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default FormAutomation;

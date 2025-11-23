/**
 * Automation Engine Service
 * Execute automation rules based on triggers
 * Replaces Base44 automation function
 */

import { query } from '../database/config.js';
import { Automation } from '../models/Automation.js';
import { Job } from '../models/Job.js';
import { Invoice } from '../models/Invoice.js';
import { sendEmail } from './email.js';
import { sendSMS } from './sms.js';
import { Webhook } from '../models/Webhook.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Execute automation rules for a specific trigger
 * @param {string} triggerType - Type of trigger
 * @param {Object} triggerData - Data associated with the trigger
 * @returns {Promise<Array>} Execution results
 */
export async function executeAutomations(triggerType, triggerData) {
  if (!triggerType) {
    throw badRequest('Trigger type is required');
  }

  // Get all active automations for this trigger type
  const automations = await query(
    `SELECT * FROM automations WHERE trigger_type = $1 AND is_active = true ORDER BY priority DESC`,
    [triggerType]
  );

  const results = [];

  for (const automation of automations.rows) {
    try {
      // Check if conditions are met
      const conditionsMet = await evaluateConditions(automation.conditions, triggerData);

      if (!conditionsMet) {
        results.push({
          automation_id: automation.id,
          automation_name: automation.name,
          executed: false,
          reason: 'Conditions not met'
        });
        continue;
      }

      // Execute actions
      const actionResults = await executeActions(automation.actions, triggerData);

      results.push({
        automation_id: automation.id,
        automation_name: automation.name,
        executed: true,
        actions: actionResults,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error);
      results.push({
        automation_id: automation.id,
        automation_name: automation.name,
        executed: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Evaluate automation conditions
 * @param {Object} conditions - Conditions to evaluate
 * @param {Object} data - Data to evaluate against
 * @returns {Promise<boolean>} Whether conditions are met
 */
async function evaluateConditions(conditions, data) {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions means always execute
  }

  const { operator = 'and', rules = [] } = conditions;

  if (rules.length === 0) {
    return true;
  }

  const results = [];

  for (const rule of rules) {
    const { field, operator: ruleOperator, value } = rule;
    const fieldValue = getNestedValue(data, field);

    let result = false;

    switch (ruleOperator) {
      case 'equals':
        result = fieldValue === value;
        break;
      case 'not_equals':
        result = fieldValue !== value;
        break;
      case 'greater_than':
        result = parseFloat(fieldValue) > parseFloat(value);
        break;
      case 'less_than':
        result = parseFloat(fieldValue) < parseFloat(value);
        break;
      case 'contains':
        result = String(fieldValue).includes(String(value));
        break;
      case 'not_contains':
        result = !String(fieldValue).includes(String(value));
        break;
      case 'in':
        result = Array.isArray(value) && value.includes(fieldValue);
        break;
      case 'not_in':
        result = Array.isArray(value) && !value.includes(fieldValue);
        break;
      case 'is_null':
        result = fieldValue === null || fieldValue === undefined;
        break;
      case 'is_not_null':
        result = fieldValue !== null && fieldValue !== undefined;
        break;
      default:
        result = false;
    }

    results.push(result);
  }

  // Combine results based on operator
  if (operator === 'and') {
    return results.every(r => r);
  } else if (operator === 'or') {
    return results.some(r => r);
  }

  return false;
}

/**
 * Execute automation actions
 * @param {Array} actions - Actions to execute
 * @param {Object} data - Data for action execution
 * @returns {Promise<Array>} Action results
 */
async function executeActions(actions, data) {
  const results = [];

  for (const action of actions) {
    try {
      let result = null;

      switch (action.type) {
        case 'send_email':
          result = await executeSendEmail(action, data);
          break;

        case 'send_sms':
          result = await executeSendSMS(action, data);
          break;

        case 'update_entity':
          result = await executeUpdateEntity(action, data);
          break;

        case 'create_entity':
          result = await executeCreateEntity(action, data);
          break;

        case 'assign_technician':
          result = await executeAssignTechnician(action, data);
          break;

        case 'update_status':
          result = await executeUpdateStatus(action, data);
          break;

        case 'create_job':
          result = await executeCreateJob(action, data);
          break;

        case 'webhook':
          result = await executeWebhook(action, data);
          break;

        case 'delay':
          result = await executeDelay(action);
          break;

        default:
          result = { success: false, error: `Unknown action type: ${action.type}` };
      }

      results.push({
        action_type: action.type,
        ...result
      });
    } catch (error) {
      results.push({
        action_type: action.type,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Execute send email action
 */
async function executeSendEmail(action, data) {
  const { to, subject, body, template_id } = action.config;

  // Replace variables in subject and body
  const processedSubject = replaceVariables(subject, data);
  const processedBody = replaceVariables(body, data);

  const result = await sendEmail({
    to: replaceVariables(to, data),
    subject: processedSubject,
    html: processedBody,
    text: processedBody
  });

  return { success: result.success, message_id: result.messageId };
}

/**
 * Execute send SMS action
 */
async function executeSendSMS(action, data) {
  const { to, message } = action.config;

  const processedMessage = replaceVariables(message, data);

  const result = await sendSMS({
    to: replaceVariables(to, data),
    message: processedMessage
  });

  return { success: result.success, sid: result.sid };
}

/**
 * Execute update entity action
 */
async function executeUpdateEntity(action, data) {
  const { entity_type, entity_id, updates } = action.config;

  const processedUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    processedUpdates[key] = replaceVariables(value, data);
  }

  // Dynamic entity update based on type
  const entityId = replaceVariables(entity_id, data);

  await query(
    `UPDATE ${entity_type} SET ${Object.keys(processedUpdates).map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${Object.keys(processedUpdates).length + 1}`,
    [...Object.values(processedUpdates), entityId]
  );

  return { success: true, entity_type, entity_id: entityId };
}

/**
 * Execute create entity action
 */
async function executeCreateEntity(action, data) {
  const { entity_type, entity_data } = action.config;

  const processedData = {};
  for (const [key, value] of Object.entries(entity_data)) {
    processedData[key] = replaceVariables(value, data);
  }

  // This would need to be more sophisticated in production
  // For now, we'll just insert directly
  const fields = Object.keys(processedData);
  const values = Object.values(processedData);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const result = await query(
    `INSERT INTO ${entity_type} (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING id`,
    values
  );

  return { success: true, entity_type, entity_id: result.rows[0].id };
}

/**
 * Execute assign technician action
 */
async function executeAssignTechnician(action, data) {
  const { job_id, technician_id } = action.config;

  const processedJobId = replaceVariables(job_id, data);
  const processedTechnicianId = replaceVariables(technician_id, data);

  await Job.update(processedJobId, {
    assigned_to: processedTechnicianId
  });

  return { success: true, job_id: processedJobId, technician_id: processedTechnicianId };
}

/**
 * Execute update status action
 */
async function executeUpdateStatus(action, data) {
  const { entity_type, entity_id, status } = action.config;

  const processedEntityId = replaceVariables(entity_id, data);
  const processedStatus = replaceVariables(status, data);

  if (entity_type === 'jobs') {
    await Job.update(processedEntityId, { status: processedStatus });
  } else if (entity_type === 'invoices') {
    await Invoice.update(processedEntityId, { status: processedStatus });
  }

  return { success: true, entity_type, entity_id: processedEntityId, status: processedStatus };
}

/**
 * Execute create job action
 */
async function executeCreateJob(action, data) {
  const { job_data } = action.config;

  const processedData = {};
  for (const [key, value] of Object.entries(job_data)) {
    processedData[key] = replaceVariables(value, data);
  }

  const job = await Job.create(processedData);

  return { success: true, job_id: job.id, job_number: job.job_number };
}

/**
 * Execute webhook action
 */
async function executeWebhook(action, data) {
  const { webhook_id, payload } = action.config;

  const processedPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    processedPayload[key] = replaceVariables(value, data);
  }

  const result = await Webhook.trigger(webhook_id, processedPayload);

  return result;
}

/**
 * Execute delay action
 */
async function executeDelay(action) {
  const { duration_ms } = action.config;

  await new Promise(resolve => setTimeout(resolve, duration_ms));

  return { success: true, delayed_ms: duration_ms };
}

/**
 * Replace variables in a string
 * Variables format: {field_name} or {nested.field.name}
 */
function replaceVariables(template, data) {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{([^}]+)\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? value : match;
  });
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Trigger automations for job created event
 */
export async function triggerJobCreated(job) {
  return await executeAutomations('job_created', job);
}

/**
 * Trigger automations for job status changed event
 */
export async function triggerJobStatusChanged(job, oldStatus) {
  return await executeAutomations('job_status_changed', {
    ...job,
    old_status: oldStatus
  });
}

/**
 * Trigger automations for invoice paid event
 */
export async function triggerInvoicePaid(invoice) {
  return await executeAutomations('invoice_paid', invoice);
}

/**
 * Trigger automations for invoice overdue event
 */
export async function triggerInvoiceOverdue(invoice) {
  return await executeAutomations('invoice_overdue', invoice);
}

/**
 * Trigger automations for time entry completed event
 */
export async function triggerTimeEntryCompleted(timeEntry) {
  return await executeAutomations('time_entry_completed', timeEntry);
}

export default {
  executeAutomations,
  triggerJobCreated,
  triggerJobStatusChanged,
  triggerInvoicePaid,
  triggerInvoiceOverdue,
  triggerTimeEntryCompleted
};

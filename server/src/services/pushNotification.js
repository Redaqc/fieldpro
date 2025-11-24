/**
 * Push Notification Service
 * Web push notifications using web-push library
 * Replaces Base44 sendNotification function
 */

import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription.js';
import { NotificationTemplate } from '../models/NotificationTemplate.js';
import { badRequest } from '../middleware/errorHandler.js';

// Configure web-push with VAPID keys
// In production, these should be in environment variables
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@fieldpro.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Send push notification to a user
 * @param {Object} params - Notification parameters
 * @returns {Promise<Object>} Result
 */
export async function sendPushNotification(params) {
  const {
    user_id,
    title,
    body,
    icon = '/icon.png',
    badge = '/badge.png',
    data = {},
    actions = [],
    tag = null,
    require_interaction = false
  } = params;

  if (!user_id) {
    throw badRequest('User ID is required');
  }
  if (!title) {
    throw badRequest('Title is required');
  }
  if (!body) {
    throw badRequest('Body is required');
  }

  // Get all active push subscriptions for the user
  const subscriptions = await PushSubscription.getByUser(user_id);

  if (subscriptions.length === 0) {
    return {
      success: false,
      message: 'No active push subscriptions found for user',
      sent_count: 0
    };
  }

  const payload = JSON.stringify({
    title,
    body,
    icon,
    badge,
    data,
    actions,
    tag,
    requireInteraction: require_interaction,
    timestamp: Date.now()
  });

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const subscription of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      };

      await webpush.sendNotification(pushSubscription, payload);

      results.push({
        subscription_id: subscription.id,
        success: true
      });
      successCount++;
    } catch (error) {
      console.error(`Push notification failed for subscription ${subscription.id}:`, error);

      // If subscription is no longer valid, deactivate it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await PushSubscription.deactivate(subscription.id);
      }

      results.push({
        subscription_id: subscription.id,
        success: false,
        error: error.message
      });
      failureCount++;
    }
  }

  return {
    success: successCount > 0,
    sent_count: successCount,
    failed_count: failureCount,
    total_subscriptions: subscriptions.length,
    results
  };
}

/**
 * Send push notification using template
 * @param {Object} params - Template parameters
 * @returns {Promise<Object>} Result
 */
export async function sendPushNotificationFromTemplate(params) {
  const { user_id, template_id, template_type, variables = {} } = params;

  let template;

  if (template_id) {
    template = await NotificationTemplate.findById(template_id);
  } else if (template_type) {
    const templates = await NotificationTemplate.getByType(template_type, 'push');
    if (templates.length === 0) {
      throw badRequest(`No template found for type: ${template_type}`);
    }
    template = templates[0];
  } else {
    throw badRequest('Either template_id or template_type is required');
  }

  if (!template.is_active) {
    throw badRequest('Template is not active');
  }

  // Render template with variables
  const rendered = await NotificationTemplate.render(template.id, variables);

  return await sendPushNotification({
    user_id,
    title: rendered.subject || 'Notification',
    body: rendered.body,
    data: variables
  });
}

/**
 * Send bulk push notifications
 * @param {Object} params - Bulk notification parameters
 * @returns {Promise<Object>} Result
 */
export async function sendBulkPushNotifications(params) {
  const { user_ids, title, body, icon, badge, data, actions } = params;

  if (!user_ids || user_ids.length === 0) {
    throw badRequest('User IDs are required');
  }

  const results = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const user_id of user_ids) {
    try {
      const result = await sendPushNotification({
        user_id,
        title,
        body,
        icon,
        badge,
        data,
        actions
      });

      results.push({
        user_id,
        ...result
      });

      totalSent += result.sent_count;
      totalFailed += result.failed_count;
    } catch (error) {
      results.push({
        user_id,
        success: false,
        error: error.message
      });
      totalFailed++;
    }
  }

  return {
    success: totalSent > 0,
    total_users: user_ids.length,
    total_sent: totalSent,
    total_failed: totalFailed,
    results
  };
}

/**
 * Subscribe user to push notifications
 * @param {Object} subscription - Subscription data
 * @returns {Promise<Object>} Created subscription
 */
export async function subscribeToPush(subscription) {
  const { user_id, endpoint, keys, device_type, user_agent } = subscription;

  if (!user_id || !endpoint || !keys) {
    throw badRequest('User ID, endpoint, and keys are required');
  }

  return await PushSubscription.create({
    user_id,
    endpoint,
    keys,
    device_type,
    user_agent
  });
}

/**
 * Unsubscribe from push notifications
 * @param {string} endpoint - Subscription endpoint
 * @returns {Promise<Object>} Result
 */
export async function unsubscribeFromPush(endpoint) {
  if (!endpoint) {
    throw badRequest('Endpoint is required');
  }

  await PushSubscription.deleteByEndpoint(endpoint);

  return {
    success: true,
    message: 'Unsubscribed successfully'
  };
}

/**
 * Get VAPID public key for client
 * @returns {string} Public key
 */
export function getVapidPublicKey() {
  if (!vapidPublicKey) {
    throw new Error('VAPID keys not configured');
  }
  return vapidPublicKey;
}

/**
 * Send notification for job assignment
 * @param {Object} job - Job data
 * @param {string} technicianId - Technician user ID
 * @returns {Promise<Object>} Result
 */
export async function sendJobAssignmentNotification(job, technicianId) {
  return await sendPushNotification({
    user_id: technicianId,
    title: 'New Job Assigned',
    body: `You have been assigned to job: ${job.title}`,
    icon: '/icons/job.png',
    data: {
      type: 'job_assignment',
      job_id: job.id,
      job_number: job.job_number
    },
    actions: [
      { action: 'view', title: 'View Job' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
}

/**
 * Send notification for invoice payment
 * @param {Object} invoice - Invoice data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result
 */
export async function sendInvoicePaidNotification(invoice, userId) {
  return await sendPushNotification({
    user_id: userId,
    title: 'Invoice Paid',
    body: `Invoice ${invoice.invoice_number} has been paid - $${invoice.total_amount}`,
    icon: '/icons/invoice.png',
    data: {
      type: 'invoice_paid',
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: invoice.total_amount
    }
  });
}

export default {
  sendPushNotification,
  sendPushNotificationFromTemplate,
  sendBulkPushNotifications,
  subscribeToPush,
  unsubscribeFromPush,
  getVapidPublicKey,
  sendJobAssignmentNotification,
  sendInvoicePaidNotification
};

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Save Push Notification Subscription
 * Stores web push notification subscription details for a user
 *
 * @param {Object} request.body - The request body
 * @param {string} request.body.endpoint - Push subscription endpoint URL
 * @param {Object} request.body.keys - Push subscription keys (p256dh, auth)
 * @param {string} request.body.user_email - User email address
 * @returns {Object} Success status and subscription ID
 */
export default async function savePushSubscription({ request }) {
  const base44 = createClientFromRequest(request);

  try {
    const { endpoint, keys, user_email } = request.body;

    // Validate required fields
    if (!endpoint || !keys || !user_email) {
      return {
        success: false,
        error: 'Missing required fields: endpoint, keys, or user_email'
      };
    }

    // Check if subscription already exists for this user
    const existingSubscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
      user_email,
      endpoint
    });

    let subscription;

    if (existingSubscriptions.length > 0) {
      // Update existing subscription
      subscription = await base44.asServiceRole.entities.PushSubscription.update(
        existingSubscriptions[0].id,
        {
          keys: JSON.stringify(keys),
          updated_at: new Date().toISOString(),
          active: true
        }
      );
    } else {
      // Create new subscription
      subscription = await base44.asServiceRole.entities.PushSubscription.create({
        user_email,
        endpoint,
        keys: JSON.stringify(keys),
        active: true,
        created_at: new Date().toISOString()
      });
    }

    return {
      success: true,
      subscription_id: subscription.id,
      message: 'Push notification subscription saved successfully'
    };

  } catch (error) {
    console.error('Error saving push subscription:', error);
    return {
      success: false,
      error: error.message || 'Failed to save push subscription'
    };
  }
}

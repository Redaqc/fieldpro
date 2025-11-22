import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AUDIT FIX: Critical Issue #1
 * Save or update push notification subscription for mobile users
 *
 * Called from: src/components/mobile/PushNotifications.jsx:42
 *
 * Purpose: Store push subscription data to enable mobile notifications
 * Security: Requires authenticated user
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        error: 'Unauthorized - Authentication required',
        success: false
      }, { status: 401 });
    }

    // Parse request body
    const { subscription, user_email } = await req.json();

    // Validate required fields
    if (!subscription) {
      return Response.json({
        error: 'Missing required field: subscription',
        success: false
      }, { status: 400 });
    }

    if (!user_email) {
      return Response.json({
        error: 'Missing required field: user_email',
        success: false
      }, { status: 400 });
    }

    // Verify user_email matches authenticated user
    if (user_email !== user.email) {
      return Response.json({
        error: 'User email mismatch - cannot save subscription for different user',
        success: false
      }, { status: 403 });
    }

    console.log(`[savePushSubscription] Saving subscription for user: ${user_email}`);

    // Check if subscription already exists for this user
    const existingSubscriptions = await base44.entities.PushSubscription.filter({
      user_email: user_email
    });

    let result;

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Update existing subscription (idempotent behavior)
      const existing = existingSubscriptions[0];

      result = await base44.entities.PushSubscription.update(existing.id, {
        subscription: subscription,
        user_email: user_email,
        updated_at: new Date().toISOString(),
        active: true
      });

      console.log(`[savePushSubscription] Updated existing subscription for ${user_email}`);
    } else {
      // Create new subscription
      result = await base44.entities.PushSubscription.create({
        subscription: subscription,
        user_email: user_email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      });

      console.log(`[savePushSubscription] Created new subscription for ${user_email}`);
    }

    return Response.json({
      success: true,
      message: 'Push subscription saved successfully',
      subscription_id: result.id
    }, { status: 200 });

  } catch (error) {
    console.error('[savePushSubscription] Error:', error);

    return Response.json({
      success: false,
      error: error.message || 'Failed to save push subscription',
      details: error.stack
    }, { status: 500 });
  }
});

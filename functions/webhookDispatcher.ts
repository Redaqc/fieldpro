import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Webhook Dispatcher
 * Triggers webhooks based on events
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_type, entity_type, entity_id, data } = await req.json();

    // Find webhooks listening to this event
    const allWebhooks = await base44.asServiceRole.entities.Webhook.filter({ active: true });
    const webhooks = allWebhooks.filter(wh => wh.events.includes(event_type));

    const results = [];

    for (const webhook of webhooks) {
      try {
        const payload = {
          event: event_type,
          entity_type,
          entity_id,
          data,
          timestamp: new Date().toISOString()
        };

        // Create signature
        const signature = await createSignature(JSON.stringify(payload), webhook.secret);

        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          ...webhook.headers
        };

        const response = await fetch(webhook.url, {
          method: webhook.method || 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await base44.asServiceRole.entities.Webhook.update(webhook.id, {
            last_triggered: new Date().toISOString(),
            success_count: (webhook.success_count || 0) + 1
          });
          results.push({ webhook_id: webhook.id, status: 'success' });
        } else {
          await base44.asServiceRole.entities.Webhook.update(webhook.id, {
            failure_count: (webhook.failure_count || 0) + 1
          });
          results.push({ webhook_id: webhook.id, status: 'failed', error: await response.text() });
        }
      } catch (error) {
        results.push({ webhook_id: webhook.id, status: 'error', error: error.message });
      }
    }

    return Response.json({ triggered: results.length, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createSignature(payload, secret) {
  if (!secret) return '';
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
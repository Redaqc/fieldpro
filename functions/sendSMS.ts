import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Send SMS Notifications
 * Note: Requires SMS provider API key in secrets (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { to, message, template_id, variables } = await req.json();

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE');

    if (!accountSid || !authToken || !fromPhone) {
      return Response.json({ 
        error: 'SMS not configured. Please set Twilio credentials in settings.' 
      }, { status: 400 });
    }

    let finalMessage = message;

    // If template_id provided, fetch template
    if (template_id) {
      const templates = await base44.asServiceRole.entities.NotificationTemplate.filter({ 
        id: template_id 
      });
      const template = templates[0];

      if (template) {
        finalMessage = template.sms_body;

        // Replace variables
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalMessage = finalMessage.replace(regex, value);
          }
        }
      }
    }

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: fromPhone,
        Body: finalMessage
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio error: ${error}`);
    }

    return Response.json({ success: true, message: 'SMS sent' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
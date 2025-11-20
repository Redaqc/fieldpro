import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Send Email Notifications
 * Uses Base44 Core.SendEmail integration
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { to, subject, body, template_id, variables } = await req.json();

    let finalSubject = subject;
    let finalBody = body;

    // If template_id provided, fetch template
    if (template_id) {
      const templates = await base44.asServiceRole.entities.NotificationTemplate.filter({ 
        id: template_id 
      });
      const template = templates[0];

      if (template) {
        finalSubject = template.email_subject;
        finalBody = template.email_body;

        // Replace variables
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalSubject = finalSubject.replace(regex, value);
            finalBody = finalBody.replace(regex, value);
          }
        }
      }
    }

    // Send via Base44 integration
    await base44.integrations.Core.SendEmail({
      to,
      subject: finalSubject,
      body: finalBody
    });

    return Response.json({ success: true, message: 'Email sent' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
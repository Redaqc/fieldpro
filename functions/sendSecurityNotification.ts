import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, changeType, oldValue, newValue, changedBy } = await req.json();

    // Get app settings to check if notifications are enabled
    const appSettings = await base44.asServiceRole.entities.AppSettings.list();
    const settings = appSettings[0] || {};

    let shouldNotify = false;
    let subject = '';
    let message = '';

    if (changeType === 'phone' && settings.notify_phone_change) {
      shouldNotify = true;
      subject = 'Security Alert: Phone Number Changed';
      message = `
        <h2>Phone Number Change Detected</h2>
        <p>A phone number was changed in your account:</p>
        <ul>
          <li><strong>Old Number:</strong> ${oldValue || 'Not set'}</li>
          <li><strong>New Number:</strong> ${newValue}</li>
          <li><strong>Changed By:</strong> ${changedBy}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you did not make this change, please contact your administrator immediately.</p>
      `;
    } else if (changeType === 'email' && settings.notify_email_change) {
      shouldNotify = true;
      subject = 'Security Alert: Email Address Changed';
      message = `
        <h2>Email Address Change Detected</h2>
        <p>An email address was changed in your account:</p>
        <ul>
          <li><strong>Old Email:</strong> ${oldValue || 'Not set'}</li>
          <li><strong>New Email:</strong> ${newValue}</li>
          <li><strong>Changed By:</strong> ${changedBy}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you did not make this change, please contact your administrator immediately.</p>
      `;
    }

    if (shouldNotify) {
      // Get all admin users
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin');

      // Send notification to all admins
      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: subject,
          body: message
        });
      }

      return Response.json({ 
        success: true, 
        message: 'Security notifications sent',
        notified: admins.length
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Notifications not enabled for this change type' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
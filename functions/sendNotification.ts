import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Send Notification Helper
 * Creates notifications for specific triggers (assignment, status change, conflict)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, event_id, event_type, technician_ids, status_change, conflict_data } = await req.json();

    if (!type || !event_id || !event_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationsSent = [];

    // Get event details
    const events = event_type === 'job' 
      ? await base44.asServiceRole.entities.Job.filter({ id: event_id })
      : await base44.asServiceRole.entities.ServiceCall.filter({ id: event_id });
    
    const event = events[0];
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const technicians = await base44.asServiceRole.entities.Technician.list();

    // 1. New Assignment Notification
    if (type === 'assignment' && technician_ids) {
      for (const techId of technician_ids) {
        const tech = technicians.find(t => t.id === techId);
        if (!tech?.email) continue;

        await base44.asServiceRole.entities.Notification.create({
          user_email: tech.email,
          type: 'new_assignment',
          title: `New ${event_type === 'job' ? 'Job' : 'Service Call'} Assignment`,
          message: `You have been assigned to "${event.title}"`,
          read: false,
          data: { event_id, event_type, assigned_by: user.email }
        });
        notificationsSent.push({ type: 'assignment', user: tech.email });
      }
    }

    // 2. Status Change Notification
    if (type === 'status_change' && status_change) {
      const { old_status, new_status } = status_change;

      // Notify assigned technicians
      for (const tech of (event.technicians || [])) {
        const techUser = technicians.find(t => t.id === tech.id);
        if (!techUser?.email) continue;

        await base44.asServiceRole.entities.Notification.create({
          user_email: techUser.email,
          type: 'status_change',
          title: `Status Updated: ${event.title}`,
          message: `Status changed from "${old_status}" to "${new_status}"`,
          read: false,
          data: { event_id, event_type, old_status, new_status }
        });
        notificationsSent.push({ type: 'status_change', user: techUser.email });
      }

      // Notify admins on completion
      if (new_status === 'completed') {
        const users = await base44.asServiceRole.entities.User.list();
        const admins = users.filter(u => u.role === 'admin');
        
        for (const admin of admins) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: admin.email,
            type: 'status_change',
            title: `${event_type === 'job' ? 'Job' : 'Service Call'} Completed`,
            message: `"${event.title}" has been completed`,
            read: false,
            data: { event_id, event_type, status: new_status }
          });
          notificationsSent.push({ type: 'status_change', user: admin.email });
        }
      }
    }

    // 3. Conflict Alert Notification
    if (type === 'conflict' && conflict_data) {
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin');

      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          type: 'conflict_alert',
          title: 'Schedule Conflict Detected',
          message: `Conflict detected for "${event.title}": ${conflict_data.message}`,
          read: false,
          data: { event_id, event_type, conflict_data }
        });
        notificationsSent.push({ type: 'conflict', user: admin.email });
      }

      // Notify affected technicians
      if (conflict_data.technician_id) {
        const tech = technicians.find(t => t.id === conflict_data.technician_id);
        if (tech?.email) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: tech.email,
            type: 'conflict_alert',
            title: 'Schedule Conflict',
            message: `Conflict detected with your schedule: ${conflict_data.message}`,
            read: false,
            data: { event_id, event_type, conflict_data }
          });
          notificationsSent.push({ type: 'conflict', user: tech.email });
        }
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
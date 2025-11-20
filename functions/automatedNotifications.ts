import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Automated Notifications System
 * Runs periodically to check for triggers and send notifications
 * Should be called by a cron job or scheduler
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const notificationsSent = [];
    const now = new Date();

    // Get all active users to notify
    const users = await base44.asServiceRole.entities.User.list();
    const technicians = await base44.asServiceRole.entities.Technician.list();
    const jobs = await base44.asServiceRole.entities.Job.list();
    const serviceCalls = await base44.asServiceRole.entities.ServiceCall.list();

    // 1. Check for upcoming reminders (24h and 2h before start)
    const upcomingEvents = [...jobs, ...serviceCalls].filter(event => {
      if (!event.start_date || event.status === 'completed') return false;
      const startDate = new Date(event.start_date);
      const hoursUntil = (startDate - now) / (1000 * 60 * 60);
      return (hoursUntil > 0 && hoursUntil <= 24) || (hoursUntil > 0 && hoursUntil <= 2);
    });

    for (const event of upcomingEvents) {
      const startDate = new Date(event.start_date);
      const hoursUntil = Math.round((startDate - now) / (1000 * 60 * 60));
      const eventType = jobs.some(j => j.id === event.id) ? 'job' : 'service_call';

      // Notify assigned technicians
      for (const tech of (event.technicians || [])) {
        const techUser = technicians.find(t => t.id === tech.id);
        if (!techUser?.email) continue;

        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: techUser.email,
          type: 'upcoming_reminder',
          data: { event_id: event.id, hours: hoursUntil }
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: techUser.email,
            type: 'upcoming_reminder',
            title: `${eventType === 'job' ? 'Job' : 'Service Call'} Starting Soon`,
            message: `"${event.title}" starts in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`,
            read: false,
            data: { event_id: event.id, event_type: eventType, hours: hoursUntil }
          });
          notificationsSent.push({ type: 'upcoming_reminder', user: techUser.email, event: event.id });
        }
      }
    }

    // 2. Check for overdue items
    const overdueEvents = [...jobs, ...serviceCalls].filter(event => {
      if (!event.due_date || event.status === 'completed') return false;
      return new Date(event.due_date) < now;
    });

    for (const event of overdueEvents) {
      const eventType = jobs.some(j => j.id === event.id) ? 'job' : 'service_call';
      const daysOverdue = Math.floor((now - new Date(event.due_date)) / (1000 * 60 * 60 * 24));

      // Notify dispatchers/admins
      const admins = users.filter(u => u.role === 'admin');
      for (const admin of admins) {
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: admin.email,
          type: 'overdue_alert',
          data: { event_id: event.id }
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: admin.email,
            type: 'overdue_alert',
            title: `Overdue ${eventType === 'job' ? 'Job' : 'Service Call'}`,
            message: `"${event.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
            read: false,
            data: { event_id: event.id, event_type: eventType, days_overdue: daysOverdue }
          });
          notificationsSent.push({ type: 'overdue_alert', user: admin.email, event: event.id });
        }
      }

      // Notify assigned technicians
      for (const tech of (event.technicians || [])) {
        const techUser = technicians.find(t => t.id === tech.id);
        if (!techUser?.email) continue;

        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: techUser.email,
          type: 'overdue_alert',
          data: { event_id: event.id }
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: techUser.email,
            type: 'overdue_alert',
            title: `Your ${eventType === 'job' ? 'Job' : 'Service Call'} is Overdue`,
            message: `"${event.title}" was due ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
            read: false,
            data: { event_id: event.id, event_type: eventType, days_overdue: daysOverdue }
          });
          notificationsSent.push({ type: 'overdue_alert', user: techUser.email, event: event.id });
        }
      }
    }

    return Response.json({
      success: true,
      timestamp: now.toISOString(),
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
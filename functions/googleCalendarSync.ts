import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Google Calendar Sync
 * Syncs jobs to Google Calendar
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, job_id } = await req.json();

    // Get Google Calendar integration
    const integrations = await base44.asServiceRole.entities.Integration.filter({
      type: 'google_calendar',
      status: 'active'
    });

    const gcalIntegration = integrations[0];
    if (!gcalIntegration) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const { access_token, calendar_id } = gcalIntegration.credentials;

    switch (action) {
      case 'create_event': {
        const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
        const job = jobs[0];

        if (!job) {
          return Response.json({ error: 'Job not found' }, { status: 404 });
        }

        const event = {
          summary: job.title,
          description: job.description,
          location: job.location || job.project_addresses?.[0],
          start: {
            dateTime: new Date(job.start_date).toISOString(),
            timeZone: 'America/Toronto'
          },
          end: {
            dateTime: new Date(job.due_date).toISOString(),
            timeZone: 'America/Toronto'
          },
          attendees: job.technicians?.map(tech => ({
            email: tech.email,
            displayName: tech.name
          }))
        };

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendar_id}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          }
        );

        if (response.ok) {
          const result = await response.json();
          await base44.asServiceRole.entities.Job.update(job.id, {
            google_calendar_event_id: result.id
          });
          return Response.json({ event_id: result.id, event_link: result.htmlLink });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      }

      case 'update_event': {
        const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
        const job = jobs[0];

        if (!job?.google_calendar_event_id) {
          return Response.json({ error: 'No calendar event linked' }, { status: 400 });
        }

        const event = {
          summary: job.title,
          description: job.description,
          location: job.location,
          start: {
            dateTime: new Date(job.start_date).toISOString(),
            timeZone: 'America/Toronto'
          },
          end: {
            dateTime: new Date(job.due_date).toISOString(),
            timeZone: 'America/Toronto'
          }
        };

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendar_id}/events/${job.google_calendar_event_id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          }
        );

        if (response.ok) {
          return Response.json({ success: true });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
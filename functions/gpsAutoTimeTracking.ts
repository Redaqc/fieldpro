import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Auto-start time tracking when technician enters job site geofence
 * Called when GPS tracking detects geofence entry
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { technician_id, latitude, longitude, timestamp } = await req.json();

    if (!technician_id || !latitude || !longitude) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const location = { lat: latitude, lng: longitude };
    const now = new Date(timestamp || Date.now());

    // Find all GPS zones
    const zones = await base44.asServiceRole.entities.GPSZone.filter({ active: true });

    // Check which zone the technician entered
    let enteredZone = null;
    for (const zone of zones) {
      const distance = getDistance(
        location.lat, 
        location.lng, 
        zone.latitude, 
        zone.longitude
      );
      
      if (distance <= (zone.radius || 100)) {
        enteredZone = zone;
        break;
      }
    }

    if (!enteredZone || !enteredZone.job_id) {
      return Response.json({ 
        message: 'No job site geofence detected',
        action_taken: false
      });
    }

    // Get the job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: enteredZone.job_id });
    const job = jobs[0];

    if (!job) {
      return Response.json({ error: 'Job not found for this zone' }, { status: 404 });
    }

    // Check if technician is assigned to this job
    const isAssigned = job.technicians?.some(t => t.id === technician_id);
    if (!isAssigned) {
      return Response.json({ 
        message: 'Technician not assigned to this job',
        action_taken: false
      });
    }

    // Check if job is in correct status
    if (job.status !== 'scheduled' && job.status !== 'in_progress') {
      return Response.json({ 
        message: 'Job not in schedulable status',
        action_taken: false
      });
    }

    // Find technician's current timer state
    const assignedTech = job.technicians.find(t => t.id === technician_id);
    
    // Don't start if already running
    if (assignedTech?.active_start) {
      return Response.json({ 
        message: 'Timer already running for this technician',
        action_taken: false
      });
    }

    // Auto-start time tracking
    const updatedTechs = job.technicians.map(t => {
      if (t.id === technician_id) {
        return {
          ...t,
          active_start: now.toISOString()
        };
      }
      return t;
    });

    const updateData = {
      technicians: updatedTechs,
      status: 'in_progress',
      started_at: job.started_at || now.toISOString(),
      activity_log: [
        ...(job.activity_log || []),
        {
          timestamp: now.toISOString(),
          user: 'GPS Auto-Tracker',
          action: 'time_tracking_started',
          details: `Time tracking auto-started for technician at job site (GPS validated)`
        }
      ]
    };

    await base44.asServiceRole.entities.Job.update(job.id, updateData);

    // Create GPS alert for zone entry
    await base44.asServiceRole.entities.GPSAlert.create({
      technician_id,
      zone_id: enteredZone.id,
      job_id: job.id,
      alert_type: 'zone_entry',
      message: `Technician entered job site - time tracking auto-started`,
      timestamp: now.toISOString(),
      latitude,
      longitude
    });

    // Notify dispatcher
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');
    const tech = await base44.asServiceRole.entities.Technician.filter({ id: technician_id });
    
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        type: 'gps_alert',
        title: 'Technician Arrived at Job Site',
        message: `${tech[0]?.first_name} ${tech[0]?.last_name} arrived at "${job.title}" - timer started`,
        read: false,
        data: { 
          job_id: job.id,
          technician_id,
          zone_id: enteredZone.id,
          auto_action: 'time_tracking_started'
        }
      });
    }

    return Response.json({
      success: true,
      action_taken: true,
      message: 'Time tracking auto-started',
      job_id: job.id,
      job_status: 'in_progress',
      technician_id,
      zone_entered: enteredZone.name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Haversine formula to calculate distance between two points
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
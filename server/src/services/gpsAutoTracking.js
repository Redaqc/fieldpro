/**
 * GPS Auto-Tracking Service
 * Automatically clock in/out based on GPS zone entry/exit
 * Replaces Base44 GPS auto-tracking function
 */

import { query } from '../database/config.js';
import { GPSZone } from '../models/GPSZone.js';
import { GPSAlert } from '../models/GPSAlert.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { Job } from '../models/Job.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Check if technician is within a job zone and auto clock in/out
 * @param {Object} params - Tracking parameters
 * @returns {Promise<Object>} Result
 */
export async function processGPSAutoTracking(params) {
  const {
    technician_id,
    lat,
    lng,
    job_id = null,
    timestamp = new Date()
  } = params;

  if (!technician_id) {
    throw badRequest('Technician ID is required');
  }
  if (!lat || !lng) {
    throw badRequest('Coordinates are required');
  }

  // Get active jobs for the technician
  const jobs = await query(
    `SELECT * FROM jobs WHERE assigned_to = $1 AND status IN ('to_do', 'in_progress')`,
    [technician_id]
  );

  const results = {
    technician_id,
    timestamp,
    location: { lat, lng },
    zones_entered: [],
    zones_exited: [],
    time_entries: [],
    jobs_started: [],
    jobs_completed: []
  };

  // Find all zones containing this point
  const zonesContaining = await GPSZone.findZonesContainingPoint(lat, lng);

  for (const job of jobs.rows) {
    if (!job.gps_latitude || !job.gps_longitude) {
      continue;
    }

    // Calculate distance to job location
    const distance = calculateDistance(
      lat,
      lng,
      parseFloat(job.gps_latitude),
      parseFloat(job.gps_longitude)
    );

    const isNearJob = distance <= 100; // Within 100 meters

    // Check if technician has an active time entry for this job
    const activeTimeEntry = await query(
      `SELECT * FROM time_entries WHERE technician_id = $1 AND status = 'in_progress' AND created_at::date = CURRENT_DATE ORDER BY clock_in DESC LIMIT 1`,
      [technician_id]
    );

    if (isNearJob) {
      // Technician is near job location
      if (activeTimeEntry.rows.length === 0) {
        // Auto clock in
        const timeEntry = await TimeEntry.create({
          technician_id,
          clock_in: timestamp,
          location_in: `${lat}, ${lng}`,
          status: 'in_progress'
        });

        results.time_entries.push({
          action: 'clock_in',
          time_entry_id: timeEntry.id,
          job_id: job.id,
          job_number: job.job_number
        });

        // Update job status to in_progress if it's to_do
        if (job.status === 'to_do') {
          await Job.update(job.id, {
            status: 'in_progress',
            actual_start: timestamp
          });

          results.jobs_started.push({
            job_id: job.id,
            job_number: job.job_number
          });
        }
      }
    } else {
      // Technician is away from job location
      if (activeTimeEntry.rows.length > 0) {
        // Auto clock out
        const timeEntry = await TimeEntry.clockOut(activeTimeEntry.rows[0].id, {
          clock_out: timestamp,
          location_out: `${lat}, ${lng}`
        });

        results.time_entries.push({
          action: 'clock_out',
          time_entry_id: timeEntry.id,
          duration_hours: timeEntry.duration_hours
        });
      }
    }
  }

  // Process GPS zone alerts
  for (const zone of zonesContaining) {
    // Check if technician was previously in this zone
    const previousAlert = await query(
      `SELECT * FROM gps_alerts WHERE technician_id = $1 AND gps_zone_id = $2
       AND alert_type = 'entered' AND created_at > NOW() - INTERVAL '1 hour'
       ORDER BY created_at DESC LIMIT 1`,
      [technician_id, zone.id]
    );

    if (previousAlert.rows.length === 0) {
      // New zone entry
      await GPSAlert.create({
        gps_zone_id: zone.id,
        technician_id,
        alert_type: 'entered',
        lat,
        lng,
        message: `Technician entered zone: ${zone.name}`
      });

      results.zones_entered.push({
        zone_id: zone.id,
        zone_name: zone.name
      });
    }
  }

  // Check for zone exits
  const recentAlerts = await query(
    `SELECT DISTINCT gps_zone_id FROM gps_alerts
     WHERE technician_id = $1 AND alert_type = 'entered'
     AND created_at > NOW() - INTERVAL '1 hour'`,
    [technician_id]
  );

  for (const alert of recentAlerts.rows) {
    const stillInZone = zonesContaining.some(z => z.id === alert.gps_zone_id);

    if (!stillInZone) {
      // Zone exit
      const zone = await GPSZone.findById(alert.gps_zone_id);

      await GPSAlert.create({
        gps_zone_id: zone.id,
        technician_id,
        alert_type: 'exited',
        lat,
        lng,
        message: `Technician exited zone: ${zone.name}`
      });

      results.zones_exited.push({
        zone_id: zone.id,
        zone_name: zone.name
      });
    }
  }

  return results;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Get technician's current location and process tracking
 * @param {string} technicianId - Technician ID
 * @returns {Promise<Object>} Latest tracking info
 */
export async function getCurrentLocationTracking(technicianId) {
  // Get latest GPS tracking entry
  const latest = await query(
    `SELECT * FROM gps_tracking WHERE technician_id = $1 ORDER BY timestamp DESC LIMIT 1`,
    [technicianId]
  );

  if (latest.rows.length === 0) {
    return null;
  }

  const tracking = latest.rows[0];

  // Process auto-tracking
  const result = await processGPSAutoTracking({
    technician_id: technicianId,
    lat: parseFloat(tracking.latitude),
    lng: parseFloat(tracking.longitude),
    timestamp: tracking.timestamp
  });

  return {
    current_location: {
      lat: tracking.latitude,
      lng: tracking.longitude,
      accuracy: tracking.accuracy,
      timestamp: tracking.timestamp
    },
    tracking_result: result
  };
}

/**
 * Enable auto-tracking for a technician
 * @param {string} technicianId - Technician ID
 * @returns {Promise<Object>} Result
 */
export async function enableAutoTracking(technicianId) {
  await query(
    'UPDATE technicians SET gps_punch_outside_zone = true WHERE id = $1',
    [technicianId]
  );

  return {
    success: true,
    technician_id: technicianId,
    auto_tracking_enabled: true
  };
}

/**
 * Disable auto-tracking for a technician
 * @param {string} technicianId - Technician ID
 * @returns {Promise<Object>} Result
 */
export async function disableAutoTracking(technicianId) {
  await query(
    'UPDATE technicians SET gps_punch_outside_zone = false WHERE id = $1',
    [technicianId]
  );

  return {
    success: true,
    technician_id: technicianId,
    auto_tracking_enabled: false
  };
}

export default {
  processGPSAutoTracking,
  getCurrentLocationTracking,
  enableAutoTracking,
  disableAutoTracking,
  calculateDistance
};

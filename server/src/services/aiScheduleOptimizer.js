/**
 * AI Schedule Optimizer Service
 * Optimizes technician schedules based on skills, location, availability, and workload
 * Replaces Base44 aiScheduleOptimizer function
 */

import { query } from '../database/config.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Optimize schedule for a given time period
 * @param {Object} params - Optimization parameters
 * @returns {Promise<Object>} Optimized schedule
 */
export async function optimizeSchedule(params) {
  const {
    start_date,
    end_date,
    technician_ids = null, // null = all technicians
    prioritize = 'urgency', // urgency, distance, skills, workload
    max_jobs_per_day = 8,
    max_hours_per_day = 10,
    consider_travel_time = true,
    balance_workload = true
  } = params;

  if (!start_date || !end_date) {
    throw badRequest('Start date and end date are required');
  }

  // Get unassigned or pending jobs in the date range
  const jobsResult = await query(
    `SELECT j.*, c.gps_latitude, c.gps_longitude, c.company_name
     FROM jobs j
     LEFT JOIN customers c ON j.customer_id = c.id
     WHERE j.scheduled_start BETWEEN $1 AND $2
     AND j.status IN ('to_do', 'scheduled')
     ${technician_ids ? 'AND (j.assigned_to = ANY($3) OR j.assigned_to IS NULL)' : ''}
     ORDER BY j.priority DESC, j.scheduled_start ASC`,
    technician_ids ? [start_date, end_date, technician_ids] : [start_date, end_date]
  );

  // Get available technicians
  const techniciansResult = await query(
    `SELECT t.*, s.schedule_date, s.shift_start, s.shift_end, s.is_available
     FROM technicians t
     LEFT JOIN schedules s ON t.id = s.technician_id
       AND s.schedule_date BETWEEN $1 AND $2
       AND s.is_available = true
       AND s.status = 'confirmed'
     WHERE t.is_active = true
     ${technician_ids ? 'AND t.id = ANY($3)' : ''}
     ORDER BY t.id, s.schedule_date`,
    technician_ids ? [start_date, end_date, technician_ids] : [start_date, end_date]
  );

  // Group technicians by ID with their schedules
  const technicians = groupTechniciansBySchedule(techniciansResult.rows);

  // Get current assignments
  const assignmentsResult = await query(
    `SELECT technician_id, scheduled_start::date as work_date,
      COUNT(*) as job_count,
      SUM(EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/3600) as total_hours
     FROM jobs
     WHERE scheduled_start BETWEEN $1 AND $2
     AND status IN ('to_do', 'in_progress', 'scheduled')
     GROUP BY technician_id, scheduled_start::date`,
    [start_date, end_date]
  );

  const currentWorkload = {};
  assignmentsResult.rows.forEach(row => {
    const key = `${row.technician_id}_${row.work_date}`;
    currentWorkload[key] = {
      job_count: parseInt(row.job_count),
      total_hours: parseFloat(row.total_hours)
    };
  });

  // Optimize assignments
  const optimizedAssignments = [];
  const unassignedJobs = [];
  const warnings = [];

  for (const job of jobsResult.rows) {
    const jobDate = new Date(job.scheduled_start).toISOString().split('T')[0];
    const jobDuration = calculateDuration(job.scheduled_start, job.scheduled_end);

    // Find best technician for this job
    const candidates = findCandidateTechnicians(
      job,
      technicians,
      jobDate,
      currentWorkload,
      {
        prioritize,
        max_jobs_per_day,
        max_hours_per_day,
        consider_travel_time
      }
    );

    if (candidates.length === 0) {
      unassignedJobs.push({
        job_id: job.id,
        job_number: job.job_number,
        reason: 'No available technicians with required skills'
      });
      continue;
    }

    // Select best candidate
    let bestCandidate = candidates[0];

    if (balance_workload) {
      // Choose technician with least workload
      bestCandidate = candidates.reduce((best, current) => {
        const bestWorkload = currentWorkload[`${best.id}_${jobDate}`]?.job_count || 0;
        const currentWorkload_count = currentWorkload[`${current.id}_${jobDate}`]?.job_count || 0;
        return currentWorkload_count < bestWorkload ? current : best;
      });
    }

    // Assign job to technician
    optimizedAssignments.push({
      job_id: job.id,
      job_number: job.job_number,
      previous_technician_id: job.assigned_to,
      recommended_technician_id: bestCandidate.id,
      technician_name: `${bestCandidate.first_name} ${bestCandidate.last_name}`,
      match_score: bestCandidate.match_score,
      reasons: bestCandidate.reasons,
      estimated_travel_time_minutes: bestCandidate.travel_time,
      workload_after: {
        job_count: (currentWorkload[`${bestCandidate.id}_${jobDate}`]?.job_count || 0) + 1,
        total_hours: (currentWorkload[`${bestCandidate.id}_${jobDate}`]?.total_hours || 0) + jobDuration
      }
    });

    // Update workload tracker
    const workloadKey = `${bestCandidate.id}_${jobDate}`;
    if (!currentWorkload[workloadKey]) {
      currentWorkload[workloadKey] = { job_count: 0, total_hours: 0 };
    }
    currentWorkload[workloadKey].job_count += 1;
    currentWorkload[workloadKey].total_hours += jobDuration;
  }

  // Generate workload balance report
  const workloadReport = generateWorkloadReport(technicians, currentWorkload, start_date, end_date);

  return {
    success: true,
    optimization_params: params,
    optimized_assignments: optimizedAssignments,
    unassigned_jobs: unassignedJobs,
    warnings,
    workload_report: workloadReport,
    stats: {
      total_jobs: jobsResult.rows.length,
      assigned: optimizedAssignments.length,
      unassigned: unassignedJobs.length,
      assignment_rate: (optimizedAssignments.length / jobsResult.rows.length * 100).toFixed(2) + '%'
    }
  };
}

/**
 * Apply optimized schedule (update job assignments)
 * @param {Array} assignments - Optimized assignments from optimizeSchedule
 * @returns {Promise<Object>} Application result
 */
export async function applyOptimizedSchedule(assignments) {
  const results = {
    applied: [],
    failed: [],
    skipped: []
  };

  for (const assignment of assignments) {
    try {
      // Check if assignment has changed
      if (assignment.previous_technician_id === assignment.recommended_technician_id) {
        results.skipped.push({
          job_id: assignment.job_id,
          reason: 'Already assigned to recommended technician'
        });
        continue;
      }

      // Update job assignment
      await query(
        'UPDATE jobs SET assigned_to = $1, updated_at = NOW() WHERE id = $2',
        [assignment.recommended_technician_id, assignment.job_id]
      );

      results.applied.push({
        job_id: assignment.job_id,
        job_number: assignment.job_number,
        technician_id: assignment.recommended_technician_id,
        technician_name: assignment.technician_name
      });
    } catch (error) {
      results.failed.push({
        job_id: assignment.job_id,
        error: error.message
      });
    }
  }

  return {
    success: true,
    applied_count: results.applied.length,
    failed_count: results.failed.length,
    skipped_count: results.skipped.length,
    results
  };
}

/**
 * Group technicians by ID with their schedules
 */
function groupTechniciansBySchedule(rows) {
  const technicians = {};

  rows.forEach(row => {
    if (!technicians[row.id]) {
      technicians[row.id] = {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        skills: row.skills || [],
        hourly_rate: row.hourly_rate,
        is_active: row.is_active,
        gps_latitude: row.gps_latitude,
        gps_longitude: row.gps_longitude,
        schedules: []
      };
    }

    if (row.schedule_date) {
      technicians[row.id].schedules.push({
        date: row.schedule_date,
        shift_start: row.shift_start,
        shift_end: row.shift_end,
        is_available: row.is_available
      });
    }
  });

  return Object.values(technicians);
}

/**
 * Find candidate technicians for a job
 */
function findCandidateTechnicians(job, technicians, jobDate, currentWorkload, options) {
  const candidates = [];

  for (const tech of technicians) {
    const score = {
      total: 0,
      reasons: [],
      travel_time: 0
    };

    // Check if technician is available on this date
    const schedule = tech.schedules.find(s => s.date === jobDate);
    if (!schedule) {
      continue; // Not scheduled for this day
    }

    // Check workload limits
    const workloadKey = `${tech.id}_${jobDate}`;
    const workload = currentWorkload[workloadKey] || { job_count: 0, total_hours: 0 };

    if (workload.job_count >= options.max_jobs_per_day) {
      continue; // Already at max jobs
    }

    if (workload.total_hours >= options.max_hours_per_day) {
      continue; // Already at max hours
    }

    // Check skills match
    const requiredSkills = job.required_skills || [];
    const techSkills = tech.skills || [];

    if (requiredSkills.length > 0) {
      const hasAllSkills = requiredSkills.every(skill => techSkills.includes(skill));
      if (hasAllSkills) {
        score.total += 50;
        score.reasons.push('Has all required skills');
      } else {
        const matchingSkills = requiredSkills.filter(skill => techSkills.includes(skill));
        if (matchingSkills.length > 0) {
          score.total += 25;
          score.reasons.push(`Has ${matchingSkills.length}/${requiredSkills.length} required skills`);
        } else {
          continue; // No matching skills
        }
      }
    } else {
      score.total += 10;
      score.reasons.push('No specific skills required');
    }

    // Calculate travel distance/time
    if (options.consider_travel_time && tech.gps_latitude && tech.gps_longitude && job.gps_latitude && job.gps_longitude) {
      const distance = calculateDistance(
        tech.gps_latitude,
        tech.gps_longitude,
        parseFloat(job.gps_latitude),
        parseFloat(job.gps_longitude)
      );

      score.travel_time = Math.round(distance / 50); // Rough estimate: 50 km/h avg speed

      // Closer is better
      if (distance < 5) {
        score.total += 30;
        score.reasons.push('Very close (< 5km)');
      } else if (distance < 20) {
        score.total += 20;
        score.reasons.push('Close (< 20km)');
      } else if (distance < 50) {
        score.total += 10;
        score.reasons.push('Moderate distance (< 50km)');
      } else {
        score.total += 5;
        score.reasons.push(`Far distance (${distance.toFixed(1)}km)`);
      }
    }

    // Workload balance bonus
    const relativeWorkload = workload.job_count / options.max_jobs_per_day;
    if (relativeWorkload < 0.5) {
      score.total += 15;
      score.reasons.push('Light workload');
    } else if (relativeWorkload < 0.75) {
      score.total += 10;
      score.reasons.push('Moderate workload');
    } else {
      score.total += 5;
      score.reasons.push('Heavy workload');
    }

    candidates.push({
      ...tech,
      match_score: score.total,
      reasons: score.reasons,
      travel_time: score.travel_time,
      current_workload: workload
    });
  }

  // Sort by score descending
  return candidates.sort((a, b) => b.match_score - a.match_score);
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate job duration in hours
 */
function calculateDuration(start, end) {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return (endTime - startTime) / (1000 * 60 * 60);
}

/**
 * Generate workload balance report
 */
function generateWorkloadReport(technicians, currentWorkload, startDate, endDate) {
  const report = [];

  for (const tech of technicians) {
    const techWorkload = {
      technician_id: tech.id,
      technician_name: `${tech.first_name} ${tech.last_name}`,
      daily_workload: [],
      total_jobs: 0,
      total_hours: 0,
      avg_jobs_per_day: 0,
      avg_hours_per_day: 0
    };

    // Iterate through each date in range
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const workloadKey = `${tech.id}_${dateStr}`;
      const dayWorkload = currentWorkload[workloadKey] || { job_count: 0, total_hours: 0 };

      techWorkload.daily_workload.push({
        date: dateStr,
        jobs: dayWorkload.job_count,
        hours: dayWorkload.total_hours
      });

      techWorkload.total_jobs += dayWorkload.job_count;
      techWorkload.total_hours += dayWorkload.total_hours;

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const daysInRange = techWorkload.daily_workload.length;
    techWorkload.avg_jobs_per_day = (techWorkload.total_jobs / daysInRange).toFixed(2);
    techWorkload.avg_hours_per_day = (techWorkload.total_hours / daysInRange).toFixed(2);

    report.push(techWorkload);
  }

  return report;
}

export default {
  optimizeSchedule,
  applyOptimizedSchedule
};

/**
 * AI Route Optimizer Service
 * Optimizes technician routes to minimize travel time and distance
 * Replaces Base44 routeOptimizer function
 * Uses Nearest Neighbor and 2-opt algorithms for route optimization
 */

import { query } from '../database/config.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Optimize route for a technician's jobs on a given date
 * @param {Object} params - Optimization parameters
 * @returns {Promise<Object>} Optimized route
 */
export async function optimizeRoute(params) {
  const {
    technician_id,
    date,
    start_location = null, // { lat, lng } - default to technician location
    end_location = null, // { lat, lng } - return to same location if null
    algorithm = '2-opt', // nearest-neighbor, 2-opt, genetic
    include_breaks = true,
    break_duration_minutes = 30,
    max_jobs_before_break = 4
  } = params;

  if (!technician_id || !date) {
    throw badRequest('Technician ID and date are required');
  }

  // Get technician info
  const techResult = await query(
    'SELECT * FROM technicians WHERE id = $1',
    [technician_id]
  );

  if (techResult.rows.length === 0) {
    throw badRequest('Technician not found');
  }

  const technician = techResult.rows[0];

  // Get jobs for this technician on this date
  const jobsResult = await query(
    `SELECT j.*, c.gps_latitude, c.gps_longitude, c.company_name, c.address
     FROM jobs j
     LEFT JOIN customers c ON j.customer_id = c.id
     WHERE j.assigned_to = $1
     AND j.scheduled_start::date = $2
     AND j.status IN ('to_do', 'scheduled', 'in_progress')
     ORDER BY j.scheduled_start ASC`,
    [technician_id, date]
  );

  const jobs = jobsResult.rows.filter(job => job.gps_latitude && job.gps_longitude);

  if (jobs.length === 0) {
    return {
      success: false,
      message: 'No jobs with valid GPS coordinates found for this technician on this date',
      technician_id,
      date,
      jobs_count: 0
    };
  }

  // Determine start location
  const startLoc = start_location || {
    lat: parseFloat(technician.gps_latitude) || 0,
    lng: parseFloat(technician.gps_longitude) || 0
  };

  // Determine end location (default to start location for round trip)
  const endLoc = end_location || startLoc;

  // Calculate distance matrix
  const locations = [
    { type: 'start', ...startLoc },
    ...jobs.map(job => ({
      type: 'job',
      id: job.id,
      lat: parseFloat(job.gps_latitude),
      lng: parseFloat(job.gps_longitude),
      job_number: job.job_number,
      priority: job.priority,
      scheduled_start: job.scheduled_start,
      scheduled_end: job.scheduled_end,
      customer_name: job.company_name,
      address: job.address
    })),
    { type: 'end', ...endLoc }
  ];

  const distanceMatrix = buildDistanceMatrix(locations);

  // Optimize route based on algorithm
  let optimizedRoute;
  if (algorithm === '2-opt') {
    optimizedRoute = optimize2Opt(locations, distanceMatrix);
  } else {
    optimizedRoute = optimizeNearestNeighbor(locations, distanceMatrix);
  }

  // Insert breaks if needed
  if (include_breaks && jobs.length > max_jobs_before_break) {
    optimizedRoute = insertBreaks(optimizedRoute, max_jobs_before_break, break_duration_minutes);
  }

  // Calculate route statistics
  const stats = calculateRouteStats(optimizedRoute, distanceMatrix);

  // Generate turn-by-turn directions
  const directions = generateDirections(optimizedRoute);

  return {
    success: true,
    technician_id,
    technician_name: `${technician.first_name} ${technician.last_name}`,
    date,
    algorithm,
    original_order: jobs.map((j, i) => ({ sequence: i + 1, job_id: j.id, job_number: j.job_number })),
    optimized_route: optimizedRoute,
    directions,
    stats,
    savings: calculateSavings(jobs, optimizedRoute, distanceMatrix)
  };
}

/**
 * Apply optimized route (update job scheduled times)
 * @param {Object} routeData - Optimized route from optimizeRoute
 * @returns {Promise<Object>} Application result
 */
export async function applyOptimizedRoute(routeData) {
  const { optimized_route, technician_id, date } = routeData;

  const results = {
    updated: [],
    failed: []
  };

  let currentTime = new Date(`${date}T08:00:00`); // Start at 8 AM

  for (const stop of optimized_route) {
    if (stop.type !== 'job') continue;

    try {
      // Calculate new scheduled times based on sequence
      const duration = stop.estimated_duration_minutes || 60; // Default 1 hour
      const scheduledStart = new Date(currentTime);
      const scheduledEnd = new Date(currentTime.getTime() + duration * 60000);

      await query(
        `UPDATE jobs SET
          scheduled_start = $1,
          scheduled_end = $2,
          updated_at = NOW()
         WHERE id = $3`,
        [scheduledStart, scheduledEnd, stop.id]
      );

      results.updated.push({
        job_id: stop.id,
        job_number: stop.job_number,
        new_start: scheduledStart,
        new_end: scheduledEnd,
        sequence: stop.sequence
      });

      // Move to next job (add duration + travel time)
      currentTime = new Date(scheduledEnd.getTime() + (stop.travel_time_from_previous || 0) * 60000);
    } catch (error) {
      results.failed.push({
        job_id: stop.id,
        error: error.message
      });
    }
  }

  return {
    success: true,
    updated_count: results.updated.length,
    failed_count: results.failed.length,
    results
  };
}

/**
 * Build distance matrix between all locations
 */
function buildDistanceMatrix(locations) {
  const matrix = [];

  for (let i = 0; i < locations.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          locations[i].lat,
          locations[i].lng,
          locations[j].lat,
          locations[j].lng
        );
      }
    }
  }

  return matrix;
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
 * Optimize route using Nearest Neighbor algorithm
 */
function optimizeNearestNeighbor(locations, distanceMatrix) {
  const route = [];
  const visited = new Set();

  // Start from location 0 (start point)
  let currentIndex = 0;
  route.push({
    ...locations[0],
    sequence: 1,
    distance_from_previous: 0,
    cumulative_distance: 0
  });
  visited.add(0);

  // Visit each job
  while (visited.size < locations.length - 1) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    // Find nearest unvisited location (excluding end point)
    for (let i = 1; i < locations.length - 1; i++) {
      if (!visited.has(i) && distanceMatrix[currentIndex][i] < nearestDistance) {
        nearestDistance = distanceMatrix[currentIndex][i];
        nearestIndex = i;
      }
    }

    if (nearestIndex === -1) break;

    const cumulativeDistance = route[route.length - 1].cumulative_distance + nearestDistance;

    route.push({
      ...locations[nearestIndex],
      sequence: route.length + 1,
      distance_from_previous: nearestDistance,
      cumulative_distance: cumulativeDistance,
      travel_time_from_previous: Math.round(nearestDistance / 0.5) // Assume 30 km/h avg speed in city
    });

    visited.add(nearestIndex);
    currentIndex = nearestIndex;
  }

  // Add end point
  const endDistance = distanceMatrix[currentIndex][locations.length - 1];
  route.push({
    ...locations[locations.length - 1],
    sequence: route.length + 1,
    distance_from_previous: endDistance,
    cumulative_distance: route[route.length - 1].cumulative_distance + endDistance,
    travel_time_from_previous: Math.round(endDistance / 0.5)
  });

  return route;
}

/**
 * Optimize route using 2-opt algorithm (improved)
 */
function optimize2Opt(locations, distanceMatrix) {
  // Start with nearest neighbor solution
  let route = optimizeNearestNeighbor(locations, distanceMatrix);

  // Extract job indices (exclude start and end)
  let jobIndices = route.slice(1, -1).map(stop => locations.indexOf(locations.find(loc => loc.id === stop.id)));

  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < jobIndices.length - 1; i++) {
      for (let j = i + 1; j < jobIndices.length; j++) {
        // Calculate current distance
        const currentDistance = calculateRouteSegmentDistance(jobIndices, distanceMatrix, i, j);

        // Reverse segment and calculate new distance
        const newIndices = [...jobIndices];
        newIndices.splice(i, j - i + 1, ...jobIndices.slice(i, j + 1).reverse());
        const newDistance = calculateRouteSegmentDistance(newIndices, distanceMatrix, i, j);

        if (newDistance < currentDistance) {
          jobIndices = newIndices;
          improved = true;
        }
      }
    }
  }

  // Rebuild route with optimized order
  const optimizedRoute = [
    {
      ...locations[0],
      sequence: 1,
      distance_from_previous: 0,
      cumulative_distance: 0
    }
  ];

  let currentIndex = 0;
  let cumulativeDistance = 0;

  for (let i = 0; i < jobIndices.length; i++) {
    const nextIndex = jobIndices[i];
    const distance = distanceMatrix[currentIndex][nextIndex];
    cumulativeDistance += distance;

    optimizedRoute.push({
      ...locations[nextIndex],
      sequence: i + 2,
      distance_from_previous: distance,
      cumulative_distance: cumulativeDistance,
      travel_time_from_previous: Math.round(distance / 0.5)
    });

    currentIndex = nextIndex;
  }

  // Add end point
  const endIndex = locations.length - 1;
  const endDistance = distanceMatrix[currentIndex][endIndex];
  optimizedRoute.push({
    ...locations[endIndex],
    sequence: optimizedRoute.length + 1,
    distance_from_previous: endDistance,
    cumulative_distance: cumulativeDistance + endDistance,
    travel_time_from_previous: Math.round(endDistance / 0.5)
  });

  return optimizedRoute;
}

/**
 * Calculate distance of a route segment
 */
function calculateRouteSegmentDistance(indices, distanceMatrix, start, end) {
  let distance = 0;
  for (let i = start; i < end; i++) {
    distance += distanceMatrix[indices[i]][indices[i + 1]];
  }
  return distance;
}

/**
 * Insert breaks into route
 */
function insertBreaks(route, maxJobsBeforeBreak, breakDuration) {
  const routeWithBreaks = [];
  let jobCount = 0;

  for (const stop of route) {
    if (stop.type === 'job') {
      jobCount++;
      if (jobCount % maxJobsBeforeBreak === 0 && jobCount < route.filter(s => s.type === 'job').length) {
        routeWithBreaks.push(stop);
        routeWithBreaks.push({
          type: 'break',
          sequence: stop.sequence + 0.5,
          duration_minutes: breakDuration,
          location: { lat: stop.lat, lng: stop.lng }
        });
      } else {
        routeWithBreaks.push(stop);
      }
    } else {
      routeWithBreaks.push(stop);
    }
  }

  return routeWithBreaks;
}

/**
 * Calculate route statistics
 */
function calculateRouteStats(route, distanceMatrix) {
  const totalDistance = route[route.length - 1].cumulative_distance;
  const totalJobs = route.filter(stop => stop.type === 'job').length;
  const totalBreaks = route.filter(stop => stop.type === 'break').length;

  // Estimate total time (travel + job duration + breaks)
  const avgJobDuration = 60; // minutes
  const totalTravelTime = route.reduce((sum, stop) => sum + (stop.travel_time_from_previous || 0), 0);
  const totalJobTime = totalJobs * avgJobDuration;
  const totalBreakTime = totalBreaks * 30;
  const totalTime = totalTravelTime + totalJobTime + totalBreakTime;

  return {
    total_distance_km: totalDistance.toFixed(2),
    total_jobs: totalJobs,
    total_breaks: totalBreaks,
    total_travel_time_minutes: totalTravelTime,
    estimated_job_time_minutes: totalJobTime,
    estimated_total_time_minutes: totalTime,
    estimated_total_time_hours: (totalTime / 60).toFixed(2),
    avg_distance_between_jobs_km: totalJobs > 1 ? (totalDistance / (totalJobs + 1)).toFixed(2) : 0
  };
}

/**
 * Calculate savings compared to original order
 */
function calculateSavings(originalJobs, optimizedRoute, distanceMatrix) {
  // Calculate original route distance
  let originalDistance = 0;
  for (let i = 0; i < originalJobs.length - 1; i++) {
    const job1 = originalJobs[i];
    const job2 = originalJobs[i + 1];
    originalDistance += calculateDistance(
      parseFloat(job1.gps_latitude),
      parseFloat(job1.gps_longitude),
      parseFloat(job2.gps_latitude),
      parseFloat(job2.gps_longitude)
    );
  }

  const optimizedDistance = optimizedRoute[optimizedRoute.length - 1].cumulative_distance;
  const savedDistance = originalDistance - optimizedDistance;
  const savedPercentage = originalDistance > 0 ? (savedDistance / originalDistance * 100) : 0;

  return {
    original_distance_km: originalDistance.toFixed(2),
    optimized_distance_km: optimizedDistance.toFixed(2),
    distance_saved_km: savedDistance.toFixed(2),
    percentage_saved: savedPercentage.toFixed(2) + '%',
    estimated_time_saved_minutes: Math.round(savedDistance / 0.5)
  };
}

/**
 * Generate turn-by-turn directions
 */
function generateDirections(route) {
  const directions = [];

  for (let i = 0; i < route.length; i++) {
    const stop = route[i];

    if (stop.type === 'start') {
      directions.push({
        step: i + 1,
        instruction: 'Start at your location',
        location: { lat: stop.lat, lng: stop.lng }
      });
    } else if (stop.type === 'job') {
      directions.push({
        step: i + 1,
        instruction: `Drive ${stop.distance_from_previous.toFixed(1)} km to ${stop.customer_name || stop.address || 'job location'}`,
        distance_km: stop.distance_from_previous.toFixed(1),
        travel_time_minutes: stop.travel_time_from_previous,
        location: { lat: stop.lat, lng: stop.lng },
        job_number: stop.job_number,
        job_id: stop.id
      });
    } else if (stop.type === 'break') {
      directions.push({
        step: i + 1,
        instruction: `Take a ${stop.duration_minutes} minute break`,
        duration_minutes: stop.duration_minutes
      });
    } else if (stop.type === 'end') {
      directions.push({
        step: i + 1,
        instruction: `Return to base (${stop.distance_from_previous.toFixed(1)} km)`,
        distance_km: stop.distance_from_previous.toFixed(1),
        travel_time_minutes: stop.travel_time_from_previous,
        location: { lat: stop.lat, lng: stop.lng }
      });
    }
  }

  return directions;
}

/**
 * Optimize routes for multiple technicians
 * @param {Object} params - Optimization parameters
 * @returns {Promise<Object>} Optimized routes for all technicians
 */
export async function optimizeMultipleRoutes(params) {
  const {
    date,
    technician_ids = null,
    algorithm = '2-opt'
  } = params;

  if (!date) {
    throw badRequest('Date is required');
  }

  // Get all technicians with jobs on this date
  const techQuery = technician_ids
    ? 'SELECT DISTINCT assigned_to FROM jobs WHERE scheduled_start::date = $1 AND assigned_to = ANY($2) AND status IN (\'to_do\', \'scheduled\', \'in_progress\')'
    : 'SELECT DISTINCT assigned_to FROM jobs WHERE scheduled_start::date = $1 AND status IN (\'to_do\', \'scheduled\', \'in_progress\')';

  const techParams = technician_ids ? [date, technician_ids] : [date];
  const techResult = await query(techQuery, techParams);

  const results = [];

  for (const row of techResult.rows) {
    if (!row.assigned_to) continue;

    try {
      const route = await optimizeRoute({
        technician_id: row.assigned_to,
        date,
        algorithm
      });

      results.push(route);
    } catch (error) {
      results.push({
        success: false,
        technician_id: row.assigned_to,
        error: error.message
      });
    }
  }

  return {
    success: true,
    date,
    technician_count: results.length,
    routes: results
  };
}

export default {
  optimizeRoute,
  applyOptimizedRoute,
  optimizeMultipleRoutes
};

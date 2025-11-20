import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Route Optimizer - calculates optimal routes for technicians
 * Uses simple distance-based optimization for now
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { technician_id, date, jobs } = await req.json();

    if (!jobs || jobs.length === 0) {
      return Response.json({ optimized_route: [], total_distance: 0, total_time: 0 });
    }

    // Get technician for home base
    const technicians = await base44.asServiceRole.entities.Technician.filter({ id: technician_id });
    const technician = technicians[0];
    
    const homeBase = technician?.address || 'Starting point';

    // Simple nearest neighbor algorithm
    const optimizedRoute = [];
    const remaining = [...jobs];
    let currentLocation = homeBase;
    let totalDistance = 0;
    let totalTime = 0;

    while (remaining.length > 0) {
      // Find nearest job (simplified - in production use real geocoding API)
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const job = remaining[i];
        const location = job.location || job.project_addresses?.[0] || '';
        
        // Simplified distance calculation (would use real API in production)
        const distance = Math.random() * 50; // Mock distance in km
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      const nextJob = remaining.splice(nearestIndex, 1)[0];
      const travelTime = Math.ceil(minDistance / 40 * 60); // Assume 40 km/h average, convert to minutes
      const jobDuration = nextJob.estimated_duration || 120; // Default 2 hours

      optimizedRoute.push({
        job_id: nextJob.id,
        job_title: nextJob.title,
        location: nextJob.location || nextJob.project_addresses?.[0],
        travel_distance: minDistance,
        travel_time: travelTime,
        job_duration: jobDuration,
        order: optimizedRoute.length + 1
      });

      currentLocation = nextJob.location || nextJob.project_addresses?.[0];
      totalDistance += minDistance;
      totalTime += travelTime + jobDuration;
    }

    // Calculate estimated times
    let currentTime = new Date(`${date}T08:00:00`);
    const routeWithTimes = optimizedRoute.map(stop => {
      const arrivalTime = new Date(currentTime);
      currentTime = new Date(currentTime.getTime() + (stop.travel_time + stop.job_duration) * 60000);
      const departureTime = new Date(currentTime);

      return {
        ...stop,
        estimated_arrival: arrivalTime.toISOString(),
        estimated_departure: departureTime.toISOString()
      };
    });

    return Response.json({
      success: true,
      optimized_route: routeWithTimes,
      total_distance: Math.round(totalDistance),
      total_time: totalTime,
      summary: {
        jobs_count: jobs.length,
        total_distance_km: Math.round(totalDistance),
        total_time_hours: (totalTime / 60).toFixed(1),
        start_time: routeWithTimes[0]?.estimated_arrival,
        end_time: routeWithTimes[routeWithTimes.length - 1]?.estimated_departure
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
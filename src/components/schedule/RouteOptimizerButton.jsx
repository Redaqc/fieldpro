import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Route, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function RouteOptimizerButton({ technician, date, jobs }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [originalStats, setOriginalStats] = useState(null);

  /**
   * Calculate original route statistics for comparison
   */
  const calculateOriginalStats = () => {
    // Sort jobs by scheduled start time to get current order
    const sortedJobs = [...jobs].sort((a, b) =>
      new Date(a.scheduled_start || 0) - new Date(b.scheduled_start || 0)
    );

    // Calculate total distance and time (simplified - assumes 50km/h average speed)
    const totalJobs = sortedJobs.length;
    const estimatedDistance = totalJobs * 15; // Rough estimate: 15km between jobs
    const estimatedTime = totalJobs * 2; // Rough estimate: 2 hours per job including travel

    return {
      jobs_count: totalJobs,
      total_distance_km: estimatedDistance,
      total_time_hours: estimatedTime
    };
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      // Calculate original stats before optimization
      const original = calculateOriginalStats();
      setOriginalStats(original);

      const { data } = await base44.functions.invoke('routeOptimizer', {
        technician_id: technician.id,
        date: format(date, 'yyyy-MM-dd'),
        jobs: jobs
      });

      /**
       * AUDIT FIX: MEDIUM Priority Issue #35 - Route Optimizer Validation
       * Validate optimized route data before displaying
       */

      // Validation 1: Check that data structure is complete
      if (!data || !data.summary || !data.optimized_route) {
        throw new Error('Invalid optimization result: missing required data');
      }

      // Validation 2: Check that all jobs are included in optimized route
      if (data.summary.jobs_count !== jobs.length) {
        throw new Error(
          `Route validation failed: Expected ${jobs.length} jobs, got ${data.summary.jobs_count}`
        );
      }

      // Validation 3: Check that route actually provides improvement
      const improvementDistance = ((original.total_distance_km - data.summary.total_distance_km) / original.total_distance_km) * 100;
      const improvementTime = ((original.total_time_hours - data.summary.total_time_hours) / original.total_time_hours) * 100;

      if (improvementDistance < -10 || improvementTime < -10) {
        console.warn('Optimized route may be worse than original route');
        // Still allow, but user will see comparison
      }

      // Validation 4: Check for logical route order (no null/invalid stops)
      const invalidStops = data.optimized_route.filter(stop =>
        !stop.order || !stop.job_title || !stop.location || !stop.estimated_arrival
      );

      if (invalidStops.length > 0) {
        throw new Error(
          `Route validation failed: ${invalidStops.length} stops have missing data`
        );
      }

      setOptimizedRoute(data);
    } catch (error) {
      alert('Failed to optimize route: ' + error.message);
      setOptimizedRoute(null);
      setOriginalStats(null);
    } finally {
      setOptimizing(false);
    }
  };

  const applyRoute = () => {
    // Would update job times in the database
    alert('Route optimization applied! (Implementation pending)');
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDialogOpen(true);
          if (!optimizedRoute) handleOptimize();
        }}
        className="border-green-300 text-green-700 hover:bg-green-50"
      >
        <Route className="w-4 h-4 mr-2" />
        Optimize Route
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Route Optimization for {technician.first_name}</DialogTitle>
          </DialogHeader>

          {optimizing ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3">Calculating optimal route...</span>
            </div>
          ) : optimizedRoute ? (
            <div className="space-y-4">
              {/* AUDIT FIX #35: Comparison between original and optimized routes */}
              {originalStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Route Optimization Impact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-slate-600 mb-1">Distance</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-400 line-through">
                          {originalStats.total_distance_km} km
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          {optimizedRoute.summary?.total_distance_km} km
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-green-600 mt-1">
                        {((originalStats.total_distance_km - optimizedRoute.summary?.total_distance_km) / originalStats.total_distance_km * 100).toFixed(1)}% reduction
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-slate-600 mb-1">Time</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-400 line-through">
                          {originalStats.total_time_hours}h
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          {optimizedRoute.summary?.total_time_hours}h
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-green-600 mt-1">
                        {((originalStats.total_time_hours - optimizedRoute.summary?.total_time_hours) / originalStats.total_time_hours * 100).toFixed(1)}% reduction
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-700">{optimizedRoute.summary?.jobs_count}</p>
                    <p className="text-xs text-slate-600">Jobs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{optimizedRoute.summary?.total_distance_km} km</p>
                    <p className="text-xs text-slate-600">Optimized Distance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{optimizedRoute.summary?.total_time_hours}h</p>
                    <p className="text-xs text-slate-600">Optimized Time</p>
                  </div>
                </div>
              </div>

              {/* Route Steps */}
              <div className="space-y-3">
                {optimizedRoute.optimized_route?.map((stop, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {stop.order}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{stop.job_title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          {stop.location}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded">
                            <span className="text-slate-600">Arrival:</span>
                            <span className="ml-2 font-semibold">
                              {format(new Date(stop.estimated_arrival), 'HH:mm')}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded">
                            <span className="text-slate-600">Departure:</span>
                            <span className="ml-2 font-semibold">
                              {format(new Date(stop.estimated_departure), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            🚗 {stop.travel_distance.toFixed(1)} km
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ⏱️ {stop.job_duration} min
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={applyRoute} className="flex-1 bg-green-600 hover:bg-green-700">
                  Apply Route
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
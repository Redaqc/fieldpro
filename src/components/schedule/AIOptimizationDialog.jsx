import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, MapPin, Clock, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AIOptimizationDialog({ 
  open, 
  onClose, 
  dateRange,
  onApply 
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedRecs, setSelectedRecs] = useState([]);
  const queryClient = useQueryClient();

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const updateServiceCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceCall.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
    },
  });

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiScheduleOptimizer', {
        date_range: dateRange,
        optimization_type: 'balanced_workload'
      });
      setResults(data);
      // Auto-select high priority recommendations
      setSelectedRecs(data.recommendations?.filter(r => r.priority_score >= 7).map(r => r.event_id) || []);
    } catch (error) {
      alert('Failed to analyze schedule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendations = async () => {
    if (!results || selectedRecs.length === 0) return;

    setLoading(true);
    try {
      for (const recId of selectedRecs) {
        const rec = results.recommendations.find(r => r.event_id === recId);
        if (!rec?.event || !rec.suggested_techs) continue;

        const technicianObjects = rec.suggested_techs.map(t => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`,
          time_spent: 0,
          time_logs: []
        }));

        const updateData = { technicians: technicianObjects };

        if (rec.event.type === 'job') {
          await updateJobMutation.mutateAsync({ id: rec.event.id, data: updateData });
        } else {
          await updateServiceCallMutation.mutateAsync({ id: rec.event.id, data: updateData });
        }
      }

      alert(`Successfully applied ${selectedRecs.length} recommendations!`);
      onApply && onApply();
      onClose();
    } catch (error) {
      alert('Failed to apply recommendations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecommendation = (eventId) => {
    setSelectedRecs(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Schedule Optimization
          </DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="py-12 text-center">
            <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to optimize your schedule?</h3>
            <p className="text-slate-600 mb-6">
              AI will analyze your schedule and provide smart recommendations for better efficiency
            </p>
            <Button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Analyzing...' : 'Analyze Schedule'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm text-slate-700">{results.summary}</p>
              </CardContent>
            </Card>

            {/* Conflict Warnings */}
            {results.conflict_warnings?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Potential Conflicts ({results.conflict_warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {results.conflict_warnings.map((conflict, idx) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-red-500">{conflict.type}</Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{conflict.description}</p>
                          {conflict.technician && (
                            <p className="text-xs text-slate-600 mt-1">
                              Technician: {conflict.technician.first_name} {conflict.technician.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {results.recommendations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Smart Recommendations ({results.recommendations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.recommendations.map((rec) => (
                    <div 
                      key={rec.event_id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRecs.includes(rec.event_id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => toggleRecommendation(rec.event_id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900">{rec.event?.title}</h4>
                            <Badge 
                              className={rec.priority_score >= 8 ? 'bg-red-500' : rec.priority_score >= 5 ? 'bg-orange-500' : 'bg-blue-500'}
                            >
                              Priority: {rec.priority_score}/10
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-3">{rec.reason}</p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-slate-500">Current: </span>
                              <span className="font-medium">
                                {rec.current_techs?.map(t => `${t.first_name} ${t.last_name}`).join(', ') || 'Unassigned'}
                              </span>
                            </div>
                            <span>→</span>
                            <div>
                              <span className="text-slate-500">Suggested: </span>
                              <span className="font-medium text-purple-600">
                                {rec.suggested_techs?.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {selectedRecs.includes(rec.event_id) ? (
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                          ) : (
                            <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Duration Predictions */}
            {results.duration_predictions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Duration Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.duration_predictions.map((pred, idx) => {
                      const event = results.recommendations?.find(r => r.event_id === pred.event_id)?.event;
                      return (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-medium text-sm text-slate-900">{event?.title || pred.event_id}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-600">
                              Predicted: {pred.predicted_hours}h
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {pred.confidence} confidence
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Route Optimizations */}
            {results.route_optimizations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    Route Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.route_optimizations.map((route, idx) => {
                    const tech = results.recommendations[0]?.suggested_techs?.find(t => t.id === route.technician_id);
                    return (
                      <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-medium text-sm text-slate-900 mb-1">
                          {tech?.first_name} {tech?.last_name}
                        </p>
                        <p className="text-xs text-slate-600 mb-2">
                          Time Saved: {route.estimated_time_saved}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {route.optimized_sequence?.map((eventId, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {i + 1}. {eventId.slice(0, 8)}...
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {results && (
            <>
              <Button 
                variant="outline" 
                onClick={handleAnalyze}
                disabled={loading}
              >
                Re-analyze
              </Button>
              <Button 
                onClick={handleApplyRecommendations}
                disabled={loading || selectedRecs.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Apply {selectedRecs.length} Selected
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
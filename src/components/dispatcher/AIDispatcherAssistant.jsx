import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, MapPin, Clock, AlertTriangle, Users, CheckCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes, differenceInMinutes } from "date-fns";

export default function AIDispatcherAssistant({ jobs, serviceCalls, technicians, onAssign }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const queryClient = useQueryClient();

  const { data: gpsData = [] } = useQuery({
    queryKey: ['recentGPS'],
    queryFn: async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      return await base44.entities.GPSTracking.filter({ 
        timestamp: { $gte: twoHoursAgo }
      });
    },
    refetchInterval: 30000,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ workItem, technicianId, scheduledTime }) => {
      const tech = technicians.find(t => t.id === technicianId);
      const techData = {
        id: tech.id,
        name: `${tech.first_name} ${tech.last_name}`,
        time_spent: 0,
        time_logs: []
      };

      const updateData = {
        technicians: [techData],
        status: 'scheduled',
        start_date: scheduledTime
      };

      if (workItem.type === 'job') {
        return await base44.entities.Job.update(workItem.id, updateData);
      } else {
        return await base44.entities.ServiceCall.update(workItem.id, updateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
    },
  });

  const analyzeAndSuggest = async () => {
    setAnalyzing(true);
    try {
      // Combine unassigned work
      const unassignedJobs = jobs.filter(j => 
        (!j.technicians || j.technicians.length === 0) && 
        j.status !== 'completed' && 
        j.status !== 'cancelled'
      ).map(j => ({ ...j, type: 'job' }));

      const unassignedCalls = serviceCalls.filter(c => 
        (!c.technicians || c.technicians.length === 0) && 
        c.status !== 'completed' && 
        c.status !== 'cancelled'
      ).map(c => ({ ...c, type: 'service_call' }));

      const allUnassigned = [...unassignedJobs, ...unassignedCalls];

      if (allUnassigned.length === 0) {
        setSuggestions({ message: "No unassigned work to dispatch!", assignments: [] });
        setAnalyzing(false);
        return;
      }

      // Get current assignments
      const assignedJobs = jobs.filter(j => j.technicians?.length > 0 && j.status !== 'completed');
      const assignedCalls = serviceCalls.filter(c => c.technicians?.length > 0 && c.status !== 'completed');

      // Calculate technician workloads
      const techWorkload = technicians.map(tech => {
        const myJobs = assignedJobs.filter(j => j.technicians.some(t => t.id === tech.id));
        const myCalls = assignedCalls.filter(c => c.technicians.some(t => t.id === tech.id));
        
        return {
          id: tech.id,
          name: `${tech.first_name} ${tech.last_name}`,
          currentWorkload: myJobs.length + myCalls.length,
          skills: tech.skills || [],
          status: tech.status || 'available',
          lastLocation: getLastKnownLocation(tech.id)
        };
      });

      // AI-powered assignment logic
      const aiPrompt = `
Analyze this field service dispatch scenario and provide optimal technician assignments:

Unassigned Work (${allUnassigned.length} items):
${allUnassigned.map(w => `
- ${w.type === 'job' ? 'JOB' : 'SERVICE CALL'}: "${w.title}"
  Priority: ${w.priority || 'medium'}
  Location: ${w.location || w.project_addresses?.[0] || 'No location'}
  ${w.due_date ? `Due: ${format(new Date(w.due_date), 'PPP')}` : ''}
  ${w.call_type ? `Type: ${w.call_type}` : ''}
`).join('\n')}

Available Technicians (${techWorkload.length}):
${techWorkload.filter(t => t.status === 'available').map(t => `
- ${t.name}
  Current Workload: ${t.currentWorkload} jobs
  Skills: ${t.skills.join(', ') || 'General'}
  Status: ${t.status}
  ${t.lastLocation ? `Last Location: ${t.lastLocation.address || `${t.lastLocation.latitude},${t.lastLocation.longitude}`}` : ''}
`).join('\n')}

Rules:
1. Balance workload across technicians
2. Match skills with job requirements when possible
3. Prioritize urgent/high priority work
4. Consider travel distance from last known location
5. Suggest optimal scheduling times

Provide assignments as JSON array with this structure:
[{
  "work_item_id": "string",
  "work_item_title": "string", 
  "technician_id": "string",
  "technician_name": "string",
  "reason": "string (why this assignment)",
  "priority_score": number (0-100),
  "suggested_time": "ISO datetime",
  "estimated_travel_minutes": number,
  "confidence": number (0-100)
}]
      `;

      const { data } = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  work_item_id: { type: "string" },
                  work_item_title: { type: "string" },
                  technician_id: { type: "string" },
                  technician_name: { type: "string" },
                  reason: { type: "string" },
                  priority_score: { type: "number" },
                  suggested_time: { type: "string" },
                  estimated_travel_minutes: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            summary: { type: "string" },
            conflicts_detected: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  technician_name: { type: "string" },
                  issue: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Enrich suggestions with work item data
      const enrichedAssignments = data.assignments.map(assignment => {
        const workItem = allUnassigned.find(w => w.id === assignment.work_item_id);
        return {
          ...assignment,
          workItem
        };
      });

      setSuggestions({
        ...data,
        assignments: enrichedAssignments
      });

    } catch (error) {
      console.error('AI analysis error:', error);
      setSuggestions({ 
        message: "AI analysis failed. Please try again.", 
        assignments: [],
        error: error.message 
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getLastKnownLocation = (techId) => {
    const techGPS = gpsData
      .filter(g => g.technician_id === techId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return techGPS[0] || null;
  };

  const applyAssignment = async (assignment) => {
    try {
      await assignMutation.mutateAsync({
        workItem: assignment.workItem,
        technicianId: assignment.technician_id,
        scheduledTime: assignment.suggested_time
      });

      // Remove from suggestions
      setSuggestions(prev => ({
        ...prev,
        assignments: prev.assignments.filter(a => a.work_item_id !== assignment.work_item_id)
      }));

      if (onAssign) {
        onAssign(assignment);
      }
    } catch (error) {
      alert('Failed to assign: ' + error.message);
    }
  };

  const applyAllSuggestions = async () => {
    if (!suggestions?.assignments?.length) return;

    for (const assignment of suggestions.assignments) {
      await applyAssignment(assignment);
    }

    setSuggestions(null);
  };

  const dismissSuggestion = (assignmentId) => {
    setSuggestions(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.work_item_id !== assignmentId)
    }));
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <CardTitle>AI Dispatcher Assistant</CardTitle>
          </div>
          <Button
            onClick={analyzeAndSuggest}
            disabled={analyzing}
            className="bg-white text-purple-600 hover:bg-purple-50"
          >
            {analyzing ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze & Suggest
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!suggestions ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Smart Dispatching</h3>
            <p className="text-slate-600 mb-4">
              Let AI analyze your workload and suggest optimal technician assignments
            </p>
            <ul className="text-sm text-slate-600 space-y-2 max-w-md mx-auto text-left">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Auto-assign based on skills, location & availability
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Balance workload across team
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Optimize routes and timing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Detect and resolve conflicts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Prioritize urgent calls
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {suggestions.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">{suggestions.summary}</p>
              </div>
            )}

            {/* Conflicts */}
            {suggestions.conflicts_detected?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-2">Conflicts Detected:</p>
                    <ul className="space-y-1 text-sm text-orange-800">
                      {suggestions.conflicts_detected.map((conflict, idx) => (
                        <li key={idx}>
                          <strong>{conflict.technician_name}:</strong> {conflict.issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {suggestions.assignments?.length > 0 && (
              <div className="flex justify-between items-center border-b pb-4">
                <p className="text-sm text-slate-600">
                  {suggestions.assignments.length} suggested assignment{suggestions.assignments.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuggestions(null)}
                  >
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyAllSuggestions}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply All
                  </Button>
                </div>
              </div>
            )}

            {/* Assignments */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {suggestions.assignments?.length > 0 ? (
                suggestions.assignments.map((assignment) => (
                  <Card key={assignment.work_item_id} className="border-2 hover:border-purple-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              assignment.workItem?.type === 'job' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }>
                              {assignment.workItem?.type === 'job' ? 'JOB' : 'SERVICE CALL'}
                            </Badge>
                            {assignment.workItem?.priority === 'urgent' && (
                              <Badge className="bg-red-100 text-red-700">URGENT</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {assignment.confidence}% confidence
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-lg">{assignment.work_item_title}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dismissSuggestion(assignment.work_item_id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{assignment.technician_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{format(new Date(assignment.suggested_time), 'MMM d, h:mm a')}</span>
                        </div>
                        {assignment.estimated_travel_minutes > 0 && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{assignment.estimated_travel_minutes} min travel</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>Score: {assignment.priority_score}/100</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded p-3 mb-3">
                        <p className="text-sm text-slate-700">
                          <strong>Reason:</strong> {assignment.reason}
                        </p>
                      </div>

                      <Button
                        onClick={() => applyAssignment(assignment)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={assignMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Apply This Assignment
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">
                    {suggestions.message || "No suggestions available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
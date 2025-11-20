import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI Schedule Optimizer
 * Uses AI to analyze and optimize schedule assignments
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date_range, optimization_type } = await req.json();

    if (!date_range || !date_range.start || !date_range.end) {
      return Response.json({ error: 'Date range required' }, { status: 400 });
    }

    // Fetch data
    const [jobs, serviceCalls, technicians] = await Promise.all([
      base44.asServiceRole.entities.Job.list(),
      base44.asServiceRole.entities.ServiceCall.list(),
      base44.asServiceRole.entities.Technician.list()
    ]);

    // Filter events in date range
    const startDate = new Date(date_range.start);
    const endDate = new Date(date_range.end);
    
    const allEvents = [
      ...jobs.map(j => ({ ...j, type: 'job' })),
      ...serviceCalls.map(c => ({ ...c, type: 'service_call' }))
    ].filter(e => {
      if (!e.start_date) return false;
      const eventDate = new Date(e.start_date);
      return eventDate >= startDate && eventDate <= endDate;
    });

    // Prepare context for AI
    const context = {
      events: allEvents.map(e => ({
        id: e.id,
        type: e.type,
        title: e.title,
        priority: e.priority,
        status: e.status,
        start_date: e.start_date,
        due_date: e.due_date,
        location: e.location || e.project_addresses?.[0],
        assigned_technicians: e.technicians?.map(t => t.id) || [],
        estimated_duration: e.total_time_spent || null,
        work_type: e.work_type_name
      })),
      technicians: technicians.map(t => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        specialization: t.specialization || [],
        status: t.status,
        current_workload: allEvents.filter(e => 
          e.technicians?.some(tech => tech.id === t.id)
        ).length
      }))
    };

    // Build AI prompt
    const prompt = `You are an expert scheduling AI for a field service management system. Analyze the following schedule and provide optimization recommendations.

CURRENT SCHEDULE DATA:
${JSON.stringify(context, null, 2)}

OPTIMIZATION GOAL: ${optimization_type || 'balanced_workload'}

Please analyze and provide:
1. Suggested reassignments for better workload balance
2. Predicted duration for each unassigned or newly assigned job (in hours)
3. Potential conflicts (overlapping times, technician unavailability)
4. Route optimization suggestions (group jobs by location)
5. Priority-based recommendations (urgent jobs should be assigned first)

Consider:
- Technician specializations match job requirements
- Geographic proximity to minimize travel time
- Workload distribution across technicians
- Job priority and deadlines
- Estimated completion times

Provide recommendations in JSON format with this structure:
{
  "recommendations": [
    {
      "event_id": "string",
      "current_assignment": ["tech_id"],
      "suggested_assignment": ["tech_id"],
      "reason": "string",
      "priority_score": number (1-10)
    }
  ],
  "duration_predictions": [
    {
      "event_id": "string",
      "predicted_hours": number,
      "confidence": "high|medium|low"
    }
  ],
  "conflict_warnings": [
    {
      "type": "overlap|overload|skill_mismatch",
      "event_ids": ["string"],
      "technician_id": "string",
      "description": "string"
    }
  ],
  "route_optimizations": [
    {
      "technician_id": "string",
      "optimized_sequence": ["event_id"],
      "estimated_time_saved": "string"
    }
  ],
  "summary": "string"
}`;

    // Call AI
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_id: { type: "string" },
                current_assignment: { type: "array", items: { type: "string" } },
                suggested_assignment: { type: "array", items: { type: "string" } },
                reason: { type: "string" },
                priority_score: { type: "number" }
              }
            }
          },
          duration_predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_id: { type: "string" },
                predicted_hours: { type: "number" },
                confidence: { type: "string" }
              }
            }
          },
          conflict_warnings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                event_ids: { type: "array", items: { type: "string" } },
                technician_id: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          route_optimizations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                technician_id: { type: "string" },
                optimized_sequence: { type: "array", items: { type: "string" } },
                estimated_time_saved: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    // Enrich response with event and technician details
    const enrichedRecommendations = aiResponse.recommendations?.map(rec => ({
      ...rec,
      event: allEvents.find(e => e.id === rec.event_id),
      current_techs: technicians.filter(t => rec.current_assignment?.includes(t.id)),
      suggested_techs: technicians.filter(t => rec.suggested_assignment?.includes(t.id))
    })) || [];

    const enrichedConflicts = aiResponse.conflict_warnings?.map(conflict => ({
      ...conflict,
      events: allEvents.filter(e => conflict.event_ids?.includes(e.id)),
      technician: technicians.find(t => t.id === conflict.technician_id)
    })) || [];

    return Response.json({
      success: true,
      optimization_date: new Date().toISOString(),
      date_range,
      recommendations: enrichedRecommendations,
      duration_predictions: aiResponse.duration_predictions || [],
      conflict_warnings: enrichedConflicts,
      route_optimizations: aiResponse.route_optimizations || [],
      summary: aiResponse.summary || 'No summary available'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
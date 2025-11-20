import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MapPin, Clock, TrendingUp, Users, Route, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AISchedulingAssistant({ selectedDate, jobs, technicians, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const unassignedJobs = jobs.filter(j => 
    !j.technician_id && 
    j.status === 'scheduled' &&
    j.scheduled_date === selectedDate
  );

  const scheduledJobs = jobs.filter(j => 
    j.technician_id && 
    j.scheduled_date === selectedDate &&
    (j.status === 'scheduled' || j.status === 'in_progress')
  );

  const generateOptimalSchedule = async () => {
    setLoading(true);
    try {
      const prompt = `
Tu es un expert en optimisation de planification pour techniciens. Analyse les données suivantes et fournis des recommandations:

**Date:** ${selectedDate}

**Jobs non assignés (${unassignedJobs.length}):**
${unassignedJobs.map((j, i) => `
${i + 1}. ${j.title}
   - Client: ${j.customer_name}
   - Localisation: ${j.location || 'Non spécifiée'}
   - Type: ${j.service_type}
   - Priorité: ${j.priority}
   - Durée estimée: ${j.duration_minutes || 60} minutes
   - Heure prévue: ${j.scheduled_time || 'Flexible'}
`).join('\n')}

**Techniciens disponibles (${technicians.filter(t => t.status !== 'off_duty').length}):**
${technicians.filter(t => t.status !== 'off_duty').map((t, i) => `
${i + 1}. ${t.first_name} ${t.last_name}
   - Spécialités: ${t.specialization?.join(', ') || 'Général'}
   - Statut: ${t.status}
   - Jobs actuels: ${scheduledJobs.filter(j => j.technician_id === t.id).length}
`).join('\n')}

**Jobs déjà planifiés aujourd'hui:**
${scheduledJobs.map(j => `
- ${j.title} assigné à ${j.technician_name} (${j.scheduled_time || 'Non spécifié'})
`).join('\n')}

Fournis:
1. **Assignations recommandées** pour chaque job non assigné avec justification (proximité, compétences, charge de travail)
2. **Routes optimales** pour chaque technicien incluant l'ordre des visites
3. **Temps de trajet estimés** entre les jobs
4. **Alertes** sur les conflits potentiels ou surcharges
5. **Score d'optimisation** (0-100) pour cette planification

Utilise des données de trafic en temps réel pour les estimations.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  job_id: { type: "string" },
                  job_title: { type: "string" },
                  technician_id: { type: "string" },
                  technician_name: { type: "string" },
                  reason: { type: "string" },
                  estimated_start_time: { type: "string" },
                  estimated_duration: { type: "number" },
                  travel_time_minutes: { type: "number" }
                }
              }
            },
            routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  technician_id: { type: "string" },
                  technician_name: { type: "string" },
                  stops: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        job_title: { type: "string" },
                        time: { type: "string" },
                        location: { type: "string" }
                      }
                    }
                  },
                  total_travel_time: { type: "number" }
                }
              }
            },
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  message: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            optimization_score: { type: "number" }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Erreur lors de la génération des suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyAssignment = (assignment) => {
    onApplySuggestion({
      job_id: assignment.job_id,
      technician_id: assignment.technician_id,
      scheduled_time: assignment.estimated_start_time,
      estimated_duration: assignment.estimated_duration,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Assistant IA de planification</h3>
        </div>
        <Button 
          onClick={generateOptimalSchedule} 
          disabled={loading || unassignedJobs.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Optimiser la planification
            </>
          )}
        </Button>
      </div>

      {unassignedJobs.length === 0 && !suggestions && (
        <div className="text-center py-8 text-slate-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>Tous les jobs sont assignés pour cette date</p>
        </div>
      )}

      {unassignedJobs.length > 0 && !suggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{unassignedJobs.length} job(s) non assigné(s)</strong> pour le {format(new Date(selectedDate), 'PPP', { locale: fr })}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Cliquez sur "Optimiser" pour obtenir des suggestions d'assignation intelligentes basées sur la localisation, les compétences et la disponibilité.
          </p>
        </div>
      )}

      {suggestions && (
        <div className="space-y-6">
          {/* Optimization Score */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Score d'optimisation</p>
                <p className="text-xs text-slate-600">Basé sur la proximité, compétences et charge de travail</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600">{suggestions.optimization_score}</p>
                <p className="text-xs text-slate-500">/ 100</p>
              </div>
            </div>
          </div>

          {/* Assignments */}
          {suggestions.assignments?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assignations recommandées
              </h4>
              <div className="space-y-3">
                {suggestions.assignments.map((assignment, idx) => (
                  <Card key={idx} className="p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{assignment.job_title}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          ➜ <strong>{assignment.technician_name}</strong>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">{assignment.reason}</p>
                        <div className="flex gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {assignment.estimated_start_time}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {assignment.estimated_duration} min
                          </Badge>
                          {assignment.travel_time_minutes > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {assignment.travel_time_minutes} min trajet
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => applyAssignment(assignment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Appliquer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Routes */}
          {suggestions.routes?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Route className="w-4 h-4" />
                Routes optimales
              </h4>
              <div className="space-y-3">
                {suggestions.routes.map((route, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{route.technician_name}</p>
                      <Badge variant="outline">
                        {route.total_travel_time} min de trajet total
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {route.stops.map((stop, stopIdx) => (
                        <div key={stopIdx} className="flex items-start gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {stopIdx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{stop.time} - {stop.job_title}</p>
                            <p className="text-xs text-slate-600">{stop.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {suggestions.alerts?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">⚠️ Alertes</h4>
              <div className="space-y-2">
                {suggestions.alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border text-sm ${
                      alert.severity === 'high' 
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : alert.severity === 'medium'
                        ? 'bg-orange-50 border-orange-200 text-orange-900'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-900'
                    }`}
                  >
                    <strong>{alert.type}:</strong> {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
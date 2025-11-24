import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Loader2 } from "lucide-react";

export default function JobEstimatedTime({ job, previousJob, technician }) {
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job?.location && technician) {
      calculateEstimation();
    }
  }, [job, previousJob, technician]);

  const calculateEstimation = async () => {
    setLoading(true);
    try {
      const prompt = `
Estime le temps de complétion pour ce job en considérant:

**Job actuel:**
- Type: ${job.service_type}
- Durée estimée: ${job.duration_minutes || 60} minutes
- Localisation: ${job.location || 'Non spécifiée'}
- Priorité: ${job.priority}
- Description: ${job.description || 'N/A'}

**Job précédent:** ${previousJob ? `
- Localisation: ${previousJob.location}
- Heure de fin prévue: ${previousJob.scheduled_time}
` : 'Aucun (premier job de la journée)'}

**Technicien:**
- Nom: ${technician.first_name} ${technician.last_name}
- Spécialités: ${technician.specialization?.join(', ') || 'Général'}

Considère:
1. Trafic en temps réel pour le trajet
2. Complexité du type de travail
3. Expérience du technicien dans ce domaine
4. Temps de déplacement depuis le job précédent

Fournis une estimation réaliste.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            travel_time_minutes: { type: "number" },
            work_duration_minutes: { type: "number" },
            total_minutes: { type: "number" },
            confidence_level: { type: "string" },
            factors: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setEstimation(response);
    } catch (error) {
      console.error('Error calculating estimation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Calcul...
      </Badge>
    );
  }

  if (!estimation) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
          <Clock className="w-3 h-3 mr-1" />
          {estimation.total_minutes} min total
        </Badge>
        {estimation.travel_time_minutes > 0 && (
          <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
            <TrendingUp className="w-3 h-3 mr-1" />
            {estimation.travel_time_minutes} min trajet
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          Confiance: {estimation.confidence_level}
        </Badge>
      </div>
      {estimation.factors?.length > 0 && (
        <p className="text-xs text-slate-600 mt-1">
          Facteurs: {estimation.factors.join(', ')}
        </p>
      )}
    </div>
  );
}
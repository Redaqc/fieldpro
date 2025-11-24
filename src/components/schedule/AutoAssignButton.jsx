import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";

export default function AutoAssignButton({ jobs, technicians, selectedDate, onComplete }) {
  const [loading, setLoading] = useState(false);

  const autoAssignJobs = async () => {
    setLoading(true);
    try {
      const unassignedJobs = jobs.filter(j => 
        !j.technician_id && 
        j.status === 'scheduled' &&
        j.scheduled_date === selectedDate
      );

      if (unassignedJobs.length === 0) {
        alert('Aucun job non assigné à traiter');
        setLoading(false);
        return;
      }

      const prompt = `
Assigne automatiquement ces jobs aux techniciens les plus appropriés:

**Jobs:**
${unassignedJobs.map((j, i) => `
${i + 1}. ${j.title}
   - Localisation: ${j.location || 'Non spécifiée'}
   - Type: ${j.service_type}
   - Priorité: ${j.priority}
   - Durée: ${j.duration_minutes || 60} min
   - Heure souhaitée: ${j.scheduled_time || 'Flexible'}
`).join('\n')}

**Techniciens:**
${technicians.filter(t => t.status !== 'off_duty').map((t, i) => `
${i + 1}. ${t.first_name} ${t.last_name} (ID: ${t.id})
   - Spécialités: ${t.specialization?.join(', ') || 'Général'}
   - Jobs actuels: ${jobs.filter(j => j.technician_id === t.id && j.scheduled_date === selectedDate).length}
`).join('\n')}

Règles:
1. Prioriser la correspondance des compétences
2. Équilibrer la charge de travail
3. Minimiser les déplacements
4. Respecter les priorités (urgent > high > medium > low)

Retourne l'assignation pour CHAQUE job.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  job_id: { type: "string" },
                  technician_id: { type: "string" },
                  estimated_start_time: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Apply assignments
      let successCount = 0;
      for (const assignment of response.assignments) {
        const job = unassignedJobs.find(j => j.id === assignment.job_id);
        const tech = technicians.find(t => t.id === assignment.technician_id);
        
        if (job && tech) {
          try {
            await base44.entities.Job.update(job.id, {
              technician_id: tech.id,
              technician_name: `${tech.first_name} ${tech.last_name}`,
              scheduled_time: assignment.estimated_start_time,
            });
            successCount++;
          } catch (error) {
            console.error('Error assigning job:', error);
          }
        }
      }

      alert(`✅ ${successCount} job(s) assigné(s) automatiquement!`);
      onComplete();
    } catch (error) {
      console.error('Error auto-assigning:', error);
      alert('Erreur lors de l\'assignation automatique');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={autoAssignJobs} 
      disabled={loading}
      variant="outline"
      className="border-purple-300 text-purple-700 hover:bg-purple-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Assignation...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 mr-2" />
          Auto-assigner
        </>
      )}
    </Button>
  );
}
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Phone, ChevronDown, ChevronUp, Navigation, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import OfflineStorage from "./OfflineStorage";

export default function MobileJobCard({ job, currentPosition, isOnline }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
    urgent: 'bg-red-600 text-white',
  };

  const openMaps = () => {
    if (job.location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`;
      window.open(url, '_blank');
    }
  };

  const callCustomer = () => {
    // In a real app, this would extract phone from customer
    window.location.href = 'tel:+1234567890';
  };

  const updateJobStatus = async (newStatus) => {
    setUpdating(true);
    try {
      if (isOnline) {
        await base44.entities.Job.update(job.id, { status: newStatus });
      } else {
        OfflineStorage.updateJobStatus(job.id, newStatus);
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          data: { id: job.id, status: newStatus },
        });
      }
      job.status = newStatus;
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Erreur lors de la mise à jour. Les données seront synchronisées plus tard.');
    } finally {
      setUpdating(false);
    }
  };

  const addJobNote = () => {
    const note = prompt('Ajouter une note:');
    if (!note) return;

    try {
      if (isOnline) {
        const logs = job.technician_logs || [];
        logs.push({
          note,
          timestamp: new Date().toISOString(),
          technician_name: job.technician_name,
        });
        base44.entities.Job.update(job.id, { technician_logs: logs });
      } else {
        OfflineStorage.addJobNote(job.id, note);
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          data: { id: job.id, technician_logs: job.technician_logs },
        });
      }
      alert('Note ajoutée avec succès');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Erreur lors de l\'ajout. La note sera synchronisée plus tard.');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-1">{job.title}</h3>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              {job.customer_name}
            </p>
          </div>
          <Badge className={statusColors[job.status]}>
            {job.status === 'scheduled' ? 'Planifié' : 
             job.status === 'in_progress' ? 'En cours' : 'Complété'}
          </Badge>
        </div>

        {job.priority && (
          <Badge className={`${priorityColors[job.priority]} mb-2`}>
            Priorité: {job.priority === 'low' ? 'Basse' : 
                      job.priority === 'medium' ? 'Moyenne' : 
                      job.priority === 'high' ? 'Haute' : 'Urgente'}
          </Badge>
        )}

        <div className="space-y-2 text-sm">
          {job.scheduled_date && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              {format(new Date(job.scheduled_date), 'EEEE d MMMM', { locale: fr })}
              {job.scheduled_time && ` à ${job.scheduled_time}`}
            </div>
          )}
          
          {job.location && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span className="flex-1 truncate">{job.location}</span>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            {job.description && (
              <p className="text-sm text-slate-700">{job.description}</p>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Changer le statut</label>
              <Select value={job.status} onValueChange={updateJobStatus} disabled={updating}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          {job.location && (
            <Button 
              onClick={openMaps}
              variant="outline" 
              className="flex-1 min-w-[100px]"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Itinéraire
            </Button>
          )}
          <Button 
            onClick={callCustomer}
            variant="outline" 
            className="flex-1 min-w-[100px]"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-1" />
            Appeler
          </Button>
          {expanded && (
            <Button
              onClick={addJobNote}
              variant="outline"
              className="flex-1 min-w-[100px]"
              size="sm"
            >
              Ajouter note
            </Button>
          )}
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            size="sm"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
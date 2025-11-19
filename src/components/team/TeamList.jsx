import React, { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, Briefcase, Trash2, UserCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors = {
  available: "bg-green-100 text-green-700",
  busy: "bg-yellow-100 text-yellow-700",
  off_duty: "bg-gray-100 text-gray-700"
};

const TechnicianCard = memo(({ tech, jobCount, onTechnicianClick, onUpdateStatus, onDelete }) => (
  <Card className="p-6 border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex flex-col items-center text-center mb-4">
      {tech.avatar_url ? (
        <img 
          src={tech.avatar_url} 
          alt={`${tech.first_name} ${tech.last_name}`}
          className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 mb-3"
        />
      ) : (
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3"
          style={{ backgroundColor: tech.color || '#64748b' }}
        >
          {tech.first_name[0]}{tech.last_name[0]}
        </div>
      )}
      <h3 className="font-semibold text-lg text-slate-900">
        {tech.first_name} {tech.last_name}
      </h3>
      {tech.role && (
        <Badge variant="secondary" className="text-xs mt-1">
          {tech.role === 'admin' ? 'Administrateur' :
           tech.role === 'manager' ? 'Gestionnaire' :
           tech.role === 'supervisor' ? 'Superviseur' : 'Technicien'}
        </Badge>
      )}
      {tech.specialization && tech.specialization.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {tech.specialization.slice(0, 2).map(spec => (
            <Badge key={spec} variant="outline" className="text-xs">
              {spec.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      )}
    </div>

    <div className="space-y-2 text-sm text-slate-600 mb-4">
      {tech.email && (
        <div className="flex items-center gap-2 justify-center">
          <Mail className="w-4 h-4" />
          <span className="truncate">{tech.email}</span>
        </div>
      )}
      {tech.phone && (
        <div className="flex items-center gap-2 justify-center">
          <Phone className="w-4 h-4" />
          <span>{tech.phone}</span>
        </div>
      )}
      <div className="flex items-center gap-2 justify-center">
        <Briefcase className="w-4 h-4" />
        <span>{jobCount} job{jobCount !== 1 ? 's' : ''} actif{jobCount !== 1 ? 's' : ''}</span>
      </div>
    </div>

    <div className="space-y-2">
      <Select 
        value={tech.status || 'available'} 
        onValueChange={(status) => onUpdateStatus(tech.id, status)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="available">Disponible</SelectItem>
          <SelectItem value="busy">Occupé</SelectItem>
          <SelectItem value="off_duty">Hors service</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => onTechnicianClick(tech)}
        >
          Voir Détails
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onDelete(tech.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
));

export default function TeamList({ technicians, isLoading, onTechnicianClick, onUpdateStatus, onDelete, jobs }) {
  const jobCountMap = useMemo(() => {
    const map = {};
    jobs.forEach(job => {
      if (job.technician_id && (job.status === 'scheduled' || job.status === 'in_progress')) {
        map[job.technician_id] = (map[job.technician_id] || 0) + 1;
      }
    });
    return map;
  }, [jobs]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-20 w-20 rounded-full mb-4 mx-auto" />
            <Skeleton className="h-6 w-32 mb-2 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </Card>
        ))}
      </div>
    );
  }

  if (technicians.length === 0) {
    return (
      <Card className="p-12 text-center">
        <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun technicien trouvé</h3>
        <p className="text-slate-500">Ajoutez votre premier technicien pour commencer</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {technicians.map((tech) => (
        <TechnicianCard
          key={tech.id}
          tech={tech}
          jobCount={jobCountMap[tech.id] || 0}
          onTechnicianClick={onTechnicianClick}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
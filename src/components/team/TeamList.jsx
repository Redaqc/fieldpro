import React from "react";
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

export default function TeamList({ technicians, isLoading, onTechnicianClick, onUpdateStatus, onDelete, jobs }) {
  const getTechnicianJobCount = (techId) => {
    return jobs.filter(j => j.technician_id === techId && (j.status === 'scheduled' || j.status === 'in_progress')).length;
  };

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
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No technicians found</h3>
        <p className="text-slate-500">Add your first technician to get started</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {technicians.map((tech) => {
        const jobCount = getTechnicianJobCount(tech.id);
        return (
          <Card key={tech.id} className="p-6 border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center mb-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3"
                style={{ backgroundColor: tech.color || '#64748b' }}
              >
                {tech.first_name[0]}{tech.last_name[0]}
              </div>
              <h3 className="font-semibold text-lg text-slate-900">
                {tech.first_name} {tech.last_name}
              </h3>
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
                <span>{jobCount} active job{jobCount !== 1 ? 's' : ''}</span>
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onTechnicianClick(tech)}
                >
                  Edit
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
        );
      })}
    </div>
  );
}
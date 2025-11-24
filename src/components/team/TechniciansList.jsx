import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Wrench, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  busy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  off_duty: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function TechniciansList({ technicians, isLoading, onSelectTech, getJobCount }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (technicians.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">No technicians yet. Add your first team member!</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {technicians.map((tech) => {
        const jobCount = getJobCount(tech.id);
        return (
          <Card 
            key={tech.id}
            className="p-6 hover:shadow-md transition-all cursor-pointer border-slate-200"
            onClick={() => onSelectTech(tech)}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{ backgroundColor: tech.color || '#64748b' }}
                >
                  {tech.first_name[0]}{tech.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {tech.first_name} {tech.last_name}
                  </h3>
                  <Badge className={statusColors[tech.status || 'available']}>
                    {(tech.status || 'available').replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {tech.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{tech.email}</span>
                  </div>
                )}
                
                {tech.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{tech.phone}</span>
                  </div>
                )}

                {tech.specialization && tech.specialization.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Wrench className="w-4 h-4" />
                    <span className="truncate">{tech.specialization.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Briefcase className="w-4 h-4" />
                  <span>{jobCount} active job{jobCount !== 1 ? 's' : ''}</span>
                </div>
                {tech.hourly_rate && (
                  <span className="text-sm font-semibold text-slate-900">
                    ${tech.hourly_rate}/hr
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS, TECHNICIAN_STATUS } from '@/constants/statuses';

const statusColors = {
  [TECHNICIAN_STATUS.AVAILABLE]: "bg-green-100 text-green-700 border-green-200",
  busy: "bg-yellow-100 text-yellow-700 border-yellow-200",
  off_duty: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function TechnicianStatus({ technicians, jobs }) {
  const getTechnicianJobCount = (techId) => {
    return jobs.filter(job =>
      job.technician_id === techId &&
      (job.status === 'scheduled' || job.status === JOB_STATUS.IN_PROGRESS)
    ).length;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg">Team Status</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {technicians.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No technicians added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {technicians.map((tech) => {
              const jobCount = getTechnicianJobCount(tech.id);
              return (
                <div key={tech.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                      style={{ backgroundColor: tech.color || '#64748b' }}
                    >
                      {tech.first_name[0]}{tech.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {tech.first_name} {tech.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {jobCount} active job{jobCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[tech.status || TECHNICIAN_STATUS.AVAILABLE]}>
                    {(tech.status || TECHNICIAN_STATUS.AVAILABLE).replace('_', ' ')}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
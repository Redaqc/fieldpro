import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  on_hold: "bg-gray-100 text-gray-800"
};

export default function DayView({ currentDate, jobs, technicians }) {
  const groupedJobs = technicians.map(tech => ({
    technician: tech,
    jobs: jobs
      .filter(job => job.technician_id === tech.id)
      .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
  }));

  const unassignedJobs = jobs
    .filter(job => !job.technician_id)
    .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));

  return (
    <div className="space-y-6">
      {groupedJobs.map(({ technician, jobs: techJobs }) => (
        <Card key={technician.id} className="p-6 border-slate-200">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: technician.color || '#64748b' }}
            >
              {technician.first_name[0]}{technician.last_name[0]}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {technician.first_name} {technician.last_name}
              </h3>
              <p className="text-sm text-slate-500">
                {techJobs.length} job{techJobs.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
          </div>

          {techJobs.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No jobs scheduled</p>
          ) : (
            <div className="space-y-3">
              {techJobs.map(job => (
                <Link
                  key={job.id}
                  to={createPageUrl("Jobs") + "?id=" + job.id}
                  className="block p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{job.title}</h4>
                        <Badge className={statusColors[job.status]}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        {job.scheduled_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{job.scheduled_time}</span>
                          </div>
                        )}
                        {job.customer_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{job.customer_name}</span>
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {job.estimated_cost && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          ${job.estimated_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      ))}

      {unassignedJobs.length > 0 && (
        <Card className="p-6 border-slate-200 border-dashed">
          <h3 className="font-semibold text-slate-900 mb-4">
            Unassigned Jobs ({unassignedJobs.length})
          </h3>
          <div className="space-y-3">
            {unassignedJobs.map(job => (
              <Link
                key={job.id}
                to={createPageUrl("Jobs") + "?id=" + job.id}
                className="block p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">{job.title}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      {job.scheduled_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.scheduled_time}</span>
                        </div>
                      )}
                      {job.customer_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{job.customer_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
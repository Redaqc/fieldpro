import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, User, MapPin, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  on_hold: "bg-gray-100 text-gray-800 border-gray-200"
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function JobsList({ jobs, isLoading, onSelectJob }) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">No jobs found. Create your first job to get started!</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <Card 
          key={job.id}
          className="p-6 hover:shadow-md transition-all cursor-pointer border-slate-200"
          onClick={() => onSelectJob(job)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {job.job_number && (
                      <span className="text-sm font-mono text-slate-500">#{job.job_number}</span>
                    )}
                    <Badge className={statusColors[job.status]}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                    {job.priority && (
                      <Badge variant="outline" className={priorityColors[job.priority]}>
                        {job.priority}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {job.title}
                  </h3>
                </div>
                
                {job.estimated_cost && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Estimate</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${job.estimated_cost.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {job.description && (
                <p className="text-slate-600 line-clamp-2">{job.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{job.customer_name || 'No customer'}</span>
                </div>
                
                {job.technician_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{job.technician_name}</span>
                  </div>
                )}
                
                {job.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(job.scheduled_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                
                {job.scheduled_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{job.scheduled_time}</span>
                  </div>
                )}
                
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-xs">{job.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, MapPin, Briefcase } from "lucide-react";
import { format } from "date-fns";

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

export default function JobsList({ jobs, isLoading, onJobClick }) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
        <p className="text-slate-500">Create your first job to get started</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <Card 
          key={job.id}
          className="p-6 hover:shadow-md transition-all cursor-pointer border-slate-200"
          onClick={() => onJobClick(job)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg text-slate-900 truncate">
                  {job.title}
                </h3>
                <Badge className={statusColors[job.status]}>
                  {job.status.replace('_', ' ')}
                </Badge>
                {job.priority && (
                  <Badge variant="outline" className={priorityColors[job.priority]}>
                    {job.priority}
                  </Badge>
                )}
              </div>

              {job.description && (
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {job.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{job.customer_name || 'No customer'}</span>
                </div>
                {job.scheduled_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(job.scheduled_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {job.scheduled_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{job.scheduled_time}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{job.location}</span>
                  </div>
                )}
              </div>

              {job.job_number && (
                <p className="text-xs text-slate-400 mt-2">
                  Job #{job.job_number}
                </p>
              )}
            </div>

            <div className="text-right">
              {job.estimated_cost && (
                <>
                  <p className="text-sm text-slate-500">Estimate</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${job.estimated_cost.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
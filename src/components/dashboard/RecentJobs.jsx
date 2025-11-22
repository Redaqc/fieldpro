import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

export default function RecentJobs({ jobs }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Recent Jobs</span>
          <Link to={createPageUrl("Jobs")} className="text-sm font-normal text-blue-600 hover:text-blue-700">
            View all
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No jobs yet. Create your first job to get started!</p>
            </div>
          ) : (
            jobs.map((job) => (
              <Link 
                key={job.id} 
                to={createPageUrl("Jobs") + "?id=" + job.id}
                className="block p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {job.title}
                      </h4>
                      <Badge className={statusColors[job.status]}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                      {job.priority && (
                        <Badge variant="outline" className={priorityColors[job.priority]}>
                          {job.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{job.customer_name || 'No customer'}</span>
                      </div>
                      {job.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(job.scheduled_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {job.scheduled_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{job.scheduled_time}</span>
                        </div>
                      )}
                    </div>

                    {job.location && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                  </div>

                  {job.estimated_cost && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Estimate</p>
                      <p className="font-semibold text-slate-900">
                        ${job.estimated_cost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
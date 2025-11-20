import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors = {
  to_do: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const priorityColors = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function JobTable({ jobs, isLoading, onJobClick, technicians }) {
  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Job</th>
              <th className="text-left p-4 font-semibold text-slate-700">Status</th>
              <th className="text-left p-4 font-semibold text-slate-700">Priority</th>
              <th className="text-left p-4 font-semibold text-slate-700">Assigned</th>
              <th className="text-left p-4 font-semibold text-slate-700">Due Date</th>
              <th className="text-left p-4 font-semibold text-slate-700">Progress</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => {
              const completedItems = (job.checklist || []).filter(i => i.completed).length;
              const totalItems = (job.checklist || []).length;
              const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
              
              return (
                <tr
                  key={job.id}
                  onClick={() => onJobClick(job)}
                  className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500">{job.job_number}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={statusColors[job.status]}>
                      {job.status?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={`${priorityColors[job.priority]} text-white`}>
                      {job.priority}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {(job.assigned_names || []).length > 0 
                      ? job.assigned_names.join(', ')
                      : '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {job.due_date ? format(new Date(job.due_date), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="p-4">
                    {totalItems > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{progress}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No checklist</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
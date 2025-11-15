import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  scheduled: "bg-blue-500",
  in_progress: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  on_hold: "bg-gray-500"
};

export default function WeekView({ currentDate, jobs, technicians }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const today = new Date();

  const getJobsForDay = (date) => {
    return jobs.filter(job => 
      job.scheduled_date && isSameDay(new Date(job.scheduled_date), date)
    );
  };

  return (
    <div className="grid grid-cols-7 gap-2 h-full">
      {weekDays.map((day, index) => {
        const dayJobs = getJobsForDay(day);
        const isToday = isSameDay(day, today);

        return (
          <Card 
            key={index}
            className={`p-3 flex flex-col ${isToday ? 'border-blue-500 border-2' : 'border-slate-200'}`}
          >
            <div className="text-center mb-3 pb-2 border-b border-slate-100">
              <p className="text-xs text-slate-500 uppercase">
                {format(day, 'EEE')}
              </p>
              <p className={`text-xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                {format(day, 'd')}
              </p>
            </div>

            <div className="space-y-2 overflow-auto flex-1">
              {dayJobs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-4">No jobs</p>
              ) : (
                dayJobs.map(job => {
                  const tech = technicians.find(t => t.id === job.technician_id);
                  return (
                    <Link
                      key={job.id}
                      to={createPageUrl("Jobs") + "?id=" + job.id}
                      className={`block p-2 rounded text-xs border-l-4 hover:shadow-sm transition-shadow ${statusColors[job.status]}`}
                      style={{ 
                        borderLeftColor: tech?.color || '#64748b',
                        backgroundColor: `${tech?.color || '#64748b'}15`
                      }}
                    >
                      <p className="font-medium text-slate-900 mb-1 line-clamp-2">
                        {job.title}
                      </p>
                      {job.scheduled_time && (
                        <p className="text-slate-600 mb-1">{job.scheduled_time}</p>
                      )}
                      {job.customer_name && (
                        <p className="text-slate-500 truncate">{job.customer_name}</p>
                      )}
                      {tech && (
                        <p className="text-slate-500 mt-1">
                          {tech.first_name} {tech.last_name[0]}.
                        </p>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
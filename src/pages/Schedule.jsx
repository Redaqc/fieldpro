import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  const getJobsForDate = (date, techId) => {
    return jobs.filter(job => {
      if (!job.scheduled_date) return false;
      const jobDate = parseISO(job.scheduled_date);
      return isSameDay(jobDate, date) && (!techId || job.technician_id === techId);
    });
  };

  const statusColors = {
    scheduled: "bg-blue-500",
    in_progress: "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
    on_hold: "bg-gray-500"
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500 mt-1">Weekly calendar view</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
              <div className="p-4 font-semibold text-slate-700 border-r border-slate-200">
                Technician
              </div>
              {weekDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 text-center border-r border-slate-200 last:border-r-0 ${
                    isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-semibold text-slate-900">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-sm mt-1 ${
                    isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : 'text-slate-600'
                  }`}>
                    {format(day, 'MMM d')}
                  </div>
                </div>
              ))}
            </div>

            {/* Technicians Rows */}
            {technicians.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p>No technicians added yet. Add team members to see their schedule.</p>
              </div>
            ) : (
              technicians.map((tech) => (
                <div key={tech.id} className="grid grid-cols-8 border-b border-slate-200 hover:bg-slate-50">
                  <div className="p-4 border-r border-slate-200 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ backgroundColor: tech.color || '#64748b' }}
                    >
                      {tech.first_name[0]}{tech.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {tech.first_name} {tech.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getJobsForDate(new Date(), tech.id).length} today
                      </p>
                    </div>
                  </div>

                  {weekDays.map((day, idx) => {
                    const dayJobs = getJobsForDate(day, tech.id);
                    return (
                      <div 
                        key={idx} 
                        className={`p-2 border-r border-slate-200 last:border-r-0 min-h-[100px] ${
                          isSameDay(day, new Date()) ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {dayJobs.map((job) => (
                            <div
                              key={job.id}
                              className="p-2 rounded bg-white border-l-4 shadow-sm hover:shadow transition-shadow cursor-pointer text-xs"
                              style={{ borderLeftColor: statusColors[job.status] }}
                            >
                              <p className="font-medium text-slate-900 truncate">
                                {job.scheduled_time || ''}
                              </p>
                              <p className="text-slate-600 truncate">
                                {job.title}
                              </p>
                              <p className="text-slate-500 truncate text-xs">
                                {job.customer_name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-sm text-slate-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-sm text-slate-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-slate-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-500"></div>
            <span className="text-sm text-slate-600">On Hold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-sm text-slate-600">Cancelled</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
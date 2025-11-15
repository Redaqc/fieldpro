import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

import WeekView from "../components/schedule/WeekView";
import DayView from "../components/schedule/DayView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");

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

  const handlePrevious = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter jobs for current view
  const filteredJobs = jobs.filter(job => {
    if (!job.scheduled_date) return false;
    
    const jobDate = new Date(job.scheduled_date);
    
    if (view === "day") {
      return isSameDay(jobDate, currentDate);
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return jobDate >= weekStart && jobDate <= weekEnd;
    }
  });

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500 mt-1">Manage jobs and technician schedules</p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          {view === "week" 
            ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
            : format(currentDate, 'MMMM d, yyyy')
          }
        </h2>

        <div className="w-32" />
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-auto">
        {view === "week" ? (
          <WeekView 
            currentDate={currentDate}
            jobs={filteredJobs}
            technicians={technicians}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            jobs={filteredJobs}
            technicians={technicians}
          />
        )}
      </div>
    </div>
  );
}
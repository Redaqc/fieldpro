import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

import WeekView from "../components/schedule/WeekView";
import DayView from "../components/schedule/DayView";
import AISchedulingAssistant from "../components/schedule/AISchedulingAssistant";
import AutoAssignButton from "../components/schedule/AutoAssignButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const queryClient = useQueryClient();

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

  const handleApplySuggestion = async (suggestion) => {
    try {
      const job = jobs.find(j => j.id === suggestion.job_id);
      const tech = technicians.find(t => t.id === suggestion.technician_id);
      
      if (job && tech) {
        await base44.entities.Job.update(job.id, {
          technician_id: tech.id,
          technician_name: `${tech.first_name} ${tech.last_name}`,
          scheduled_time: suggestion.scheduled_time,
          duration_minutes: suggestion.estimated_duration,
        });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        alert(`Job "${job.title}" assigné à ${tech.first_name} ${tech.last_name}`);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      alert('Erreur lors de l\'application de la suggestion');
    }
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
          <AutoAssignButton
            jobs={jobs}
            technicians={technicians}
            selectedDate={format(currentDate, 'yyyy-MM-dd')}
            onComplete={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
          />
          <Button 
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            variant={showAIAssistant ? "default" : "outline"}
            className={showAIAssistant ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Assistant IA
          </Button>
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

      {/* AI Assistant */}
      {showAIAssistant && (
        <AISchedulingAssistant
          selectedDate={format(currentDate, 'yyyy-MM-dd')}
          jobs={jobs}
          technicians={technicians}
          onApplySuggestion={handleApplySuggestion}
        />
      )}

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
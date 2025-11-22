import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, isSameMonth, isSameDay, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// NEW: Import our custom hooks
import { useJobs } from "@/hooks/useJobs";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useAuth } from "@/hooks/useAuth";

import JobDialog from "../components/jobs/JobDialog";

// Helper function for priority colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#3b82f6';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
};

// Job card component
const JobCard = ({ job, onClick }) => (
  <div
    className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
    onClick={onClick}
    style={{ borderLeft: `4px solid ${getPriorityColor(job.priority)}` }}
  >
    <div className="font-semibold text-sm">{job.title}</div>
    {job.technician_name && (
      <div className="text-xs text-slate-600 mt-1">{job.technician_name}</div>
    )}
    <div className="text-xs text-slate-500 mt-1">
      {job.status}
    </div>
  </div>
);

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [filterTechnician, setFilterTechnician] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // NEW: Use our custom hooks
  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000 });
  const technicians = techniciansData?.data || [];

  const { user: currentUser } = useAuth();

  // Transform data to match component expectations (snake_case)
  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    technician_name: job.technicianName,
    work_type_id: job.workTypeId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
    due_date: job.dueDate,
    start_date: job.startDate,
  }));

  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    user_id: tech.userId,
    is_active: tech.isActive,
    phone_number: tech.phoneNumber,
    first_name: tech.name?.split(' ')[0] || tech.name || '',
    last_name: tech.name?.split(' ').slice(1).join(' ') || '',
  }));

  const filteredJobs = transformedJobs.filter(job => {
    const techMatch = filterTechnician === "all" || job.technician_id === filterTechnician;
    const statusMatch = filterStatus === "all" || job.status === filterStatus;
    return techMatch && statusMatch && job.due_date;
  });

  const handlePrevious = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, -1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, -1));
    else setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const renderDayView = () => {
    const dayJobs = filteredJobs.filter(job =>
      isSameDay(parseISO(job.due_date), currentDate)
    );

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </h3>
        {dayJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Aucun job prévu pour cette journée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayJobs.map(job => (
              <JobCard key={job.id} job={job} onClick={() => handleJobClick(job)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: fr });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {days.map(day => (
            <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
              <div className="font-semibold">{format(day, 'EEE', { locale: fr })}</div>
              <div className={`text-lg ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x min-h-[500px]">
          {days.map(day => {
            const dayJobs = filteredJobs.filter(job =>
              isSameDay(parseISO(job.due_date), day)
            );
            return (
              <div key={day.toISOString()} className="p-2 space-y-1">
                {dayJobs.map(job => (
                  <div
                    key={job.id}
                    className="text-xs p-2 rounded cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: getPriorityColor(job.priority) }}
                    onClick={() => handleJobClick(job)}
                  >
                    <div className="font-semibold truncate text-white">{job.title}</div>
                    {job.technician_name && (
                      <div className="text-white opacity-90 truncate">{job.technician_name}</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: fr });
    const calendarEnd = endOfWeek(monthEnd, { locale: fr });

    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(dayName => (
            <div key={dayName} className="p-2 text-center font-semibold border-r last:border-r-0">
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dayJobs = filteredJobs.filter(job =>
              isSameDay(parseISO(job.due_date), day)
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] border-r border-b p-2 ${!isCurrentMonth ? 'bg-slate-50' : ''}`}
              >
                <div className={`text-sm mb-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map(job => (
                    <div
                      key={job.id}
                      className="text-xs p-1 rounded cursor-pointer truncate"
                      style={{ backgroundColor: getPriorityColor(job.priority) + '20', borderLeft: `2px solid ${getPriorityColor(job.priority)}` }}
                      onClick={() => handleJobClick(job)}
                    >
                      {job.title}
                    </div>
                  ))}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-slate-500">
                      +{dayJobs.length - 3} plus
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          Calendrier des Jobs
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="text-lg font-semibold ml-4">
            {view === "month" && format(currentDate, 'MMMM yyyy', { locale: fr })}
            {view === "week" && `Semaine du ${format(startOfWeek(currentDate, { locale: fr }), 'd MMM', { locale: fr })}`}
            {view === "day" && format(currentDate, 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={filterTechnician} onValueChange={setFilterTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Technicien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les techniciens</SelectItem>
              {transformedTechnicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "day" && renderDayView()}
      {view === "week" && renderWeekView()}
      {view === "month" && renderMonthView()}

      {dialogOpen && selectedJob && (
        <JobDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}
    </div>
  );
}

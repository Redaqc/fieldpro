import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, isSameMonth, isSameDay, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import JobDialog from "../components/jobs/JobDialog";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [filterTechnician, setFilterTechnician] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const filteredJobs = jobs.filter(job => {
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
            <div key={dayName} className="p-3 text-center font-semibold text-slate-600 border-r last:border-r-0">
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y">
          {days.map(day => {
            const dayJobs = filteredJobs.filter(job => 
              isSameDay(parseISO(job.due_date), day)
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 ${!isCurrentMonth ? 'bg-slate-50' : ''}`}
              >
                <div className={`text-sm mb-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-slate-600'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map(job => (
                    <div
                      key={job.id}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate"
                      style={{ backgroundColor: getPriorityColor(job.priority) }}
                      onClick={() => handleJobClick(job)}
                      title={job.title}
                    >
                      <span className="text-white font-medium">{job.title}</span>
                    </div>
                  ))}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-slate-500">+{dayJobs.length - 3} plus</div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Calendrier</h1>
          <p className="text-slate-500 mt-1">Visualisez vos jobs par date d'échéance</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="text-lg font-semibold ml-3">
            {view === "month" && format(currentDate, 'MMMM yyyy', { locale: fr })}
            {view === "week" && `Semaine du ${format(startOfWeek(currentDate, { locale: fr }), 'd MMM', { locale: fr })}`}
            {view === "day" && format(currentDate, 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={filterTechnician} onValueChange={setFilterTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les techniciens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les techniciens</SelectItem>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="todo">À faire</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="review">En révision</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="day">Jour</TabsTrigger>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="month">Mois</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "day" && renderDayView()}
      {view === "week" && renderWeekView()}
      {view === "month" && renderMonthView()}

      <JobDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        technicians={technicians}
        currentUser={currentUser}
      />
    </div>
  );
}

function JobCard({ job, onClick }) {
  const priorityColors = {
    low: 'bg-blue-100 border-blue-300',
    medium: 'bg-yellow-100 border-yellow-300',
    high: 'bg-orange-100 border-orange-300',
    urgent: 'bg-red-100 border-red-300',
  };

  const statusLabels = {
    todo: 'À faire',
    in_progress: 'En cours',
    review: 'En révision',
    completed: 'Terminé',
  };

  return (
    <div
      className={`border-l-4 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${priorityColors[job.priority] || 'bg-slate-100 border-slate-300'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-900">{job.title}</h4>
        <span className="text-xs px-2 py-1 rounded bg-white">{statusLabels[job.status]}</span>
      </div>
      {job.description && (
        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{job.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {job.technician_name && (
          <span>👤 {job.technician_name}</span>
        )}
        {job.priority && (
          <span className="capitalize">🔥 {job.priority}</span>
        )}
      </div>
    </div>
  );
}

function getPriorityColor(priority) {
  const colors = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  };
  return colors[priority] || '#64748b';
}
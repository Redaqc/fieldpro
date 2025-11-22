import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Plus, Filter, AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// NEW: Import our custom hooks
import { useJobs, useUpdateJob } from "@/hooks/useJobs";
import { useServiceCalls, useUpdateServiceCallStatus } from "@/hooks/useServiceCalls";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useAuth } from "@/hooks/useAuth";

import DayView from "@/components/schedule/DayView";
import WeekView from "@/components/schedule/WeekView";
import MonthView from "@/components/schedule/MonthView";
import AgendaView from "@/components/schedule/AgendaView";
import ResourceView from "@/components/schedule/ResourceView";
import ScheduleEventDialog from "@/components/schedule/ScheduleEventDialog";
import ConflictAlert from "@/components/schedule/ConflictAlert";
import AIOptimizationDialog from "@/components/schedule/AIOptimizationDialog";

export default function Schedule() {
  const [view, setView] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    technician: "all",
    type: "all", // job, service_call, all
    status: "all",
    priority: "all"
  });
  const [conflicts, setConflicts] = useState([]);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const queryClient = useQueryClient();

  // NEW: Use our custom hooks
  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { data: serviceCallsData } = useServiceCalls({ page: 1, limit: 1000 });
  const serviceCalls = serviceCallsData?.data || [];

  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000 });
  const technicians = techniciansData?.data || [];

  const { user: currentUser } = useAuth();

  const updateJobMutation = useUpdateJob();
  const updateServiceCallMutation = useUpdateServiceCallStatus();

  // Transform data to match component expectations (snake_case)
  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    customer_name: job.customerName,
    technician_id: job.technicianId,
    work_type_id: job.workTypeId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
    start_date: job.startDate,
    due_date: job.dueDate,
    project_addresses: job.projectAddresses,
  }));

  const transformedServiceCalls = serviceCalls.map(call => ({
    ...call,
    customer_id: call.customerId,
    customer_name: call.customerName,
    call_number: call.callNumber,
    scheduled_date: call.scheduledDate,
    completion_date: call.completionDate,
    start_date: call.startDate,
    due_date: call.dueDate,
    project_addresses: call.projectAddresses,
  }));

  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    user_id: tech.userId,
    is_active: tech.isActive,
    phone_number: tech.phoneNumber,
    first_name: tech.name?.split(' ')[0] || tech.name || '',
    last_name: tech.name?.split(' ').slice(1).join(' ') || '',
    working_hours: tech.workingHours,
  }));

  // Check if user is technician
  const currentTech = transformedTechnicians.find(t => t.email === currentUser?.email);
  const isTechnicianView = currentTech && currentUser?.role !== 'admin';

  // Transform data into calendar events
  const allEvents = useMemo(() => {
    const jobEvents = transformedJobs.map(job => ({
      id: job.id,
      type: 'job',
      title: job.title,
      client_name: job.customer_name,
      address: job.location || job.project_addresses?.[0],
      start: job.start_date ? new Date(job.start_date) : null,
      end: job.due_date ? new Date(job.due_date) : null,
      status: job.status,
      priority: job.priority || 'medium',
      technicians: job.technicians || [],
      color: '#3b82f6', // blue
      data: job
    }));

    const callEvents = transformedServiceCalls.map(call => ({
      id: call.id,
      type: 'service_call',
      title: call.title,
      client_name: call.customer_name,
      address: call.location || call.project_addresses?.[0],
      start: call.start_date ? new Date(call.start_date) : null,
      end: call.due_date ? new Date(call.due_date) : null,
      status: call.status,
      priority: call.priority || 'medium',
      technicians: call.technicians || [],
      color: '#10b981', // green
      data: call
    }));

    return [...jobEvents, ...callEvents].filter(e => e.start); // Only events with dates
  }, [transformedJobs, transformedServiceCalls]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          event.title?.toLowerCase().includes(search) ||
          event.client_name?.toLowerCase().includes(search) ||
          event.address?.toLowerCase().includes(search) ||
          event.id.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Technician filter
      if (isTechnicianView) {
        const hasTech = event.technicians.some(t => t.id === currentTech.id);
        if (!hasTech) return false;
      } else if (filters.technician !== 'all') {
        const hasTech = event.technicians.some(t => t.id === filters.technician);
        if (!hasTech) return false;
      }

      // Type filter
      if (filters.type !== 'all' && event.type !== filters.type) return false;

      // Status filter
      if (filters.status !== 'all' && event.status !== filters.status) return false;

      // Priority filter
      if (filters.priority !== 'all' && event.priority !== filters.priority) return false;

      return true;
    });
  }, [allEvents, searchTerm, filters, isTechnicianView, currentTech]);

  // Conflict detection (simplified version)
  const detectConflicts = (event, newStart, newEnd, newTechnicianIds) => {
    const conflicts = [];
    const techIds = newTechnicianIds || event.technicians.map(t => t.id);

    techIds.forEach(techId => {
      const tech = transformedTechnicians.find(t => t.id === techId);
      if (!tech) return;

      // Check overlapping events
      allEvents.forEach(existingEvent => {
        if (existingEvent.id === event.id) return;
        if (!existingEvent.technicians.some(t => t.id === techId)) return;

        const existingStart = existingEvent.start;
        const existingEnd = existingEvent.end;

        // Check overlap
        if (newStart < existingEnd && newEnd > existingStart) {
          conflicts.push({
            type: 'overlap',
            technician: tech,
            event: existingEvent,
            message: `${tech.first_name} ${tech.last_name} is already scheduled for "${existingEvent.title}"`
          });
        }
      });
    });

    return conflicts;
  };

  // Event handlers
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEventType(event.type);
    setShowEventDialog(true);
  };

  const handleEventUpdate = (eventId, eventType, updates) => {
    if (eventType === 'job') {
      updateJobMutation.mutate({ id: eventId, data: updates });
    } else if (eventType === 'service_call') {
      updateServiceCallMutation.mutate({ id: eventId, status: updates.status });
    }
  };

  const handleEventDrop = (event, newStart, newEnd) => {
    const conflicts = detectConflicts(event, newStart, newEnd);
    if (conflicts.length > 0) {
      setConflicts(conflicts);
      return;
    }

    const updates = {
      startDate: newStart.toISOString(),
      dueDate: newEnd.toISOString()
    };

    handleEventUpdate(event.id, event.type, updates);
  };

  const conflictCount = conflicts.length;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Planning & Calendrier
            </h1>
            <p className="text-slate-500 mt-1">Gérez les horaires et les affectations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAIDialog(true)} variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Optimiser avec IA
            </Button>
            <Button onClick={() => { setSelectedEvent(null); setShowEventDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>

        {/* Conflicts Alert */}
        {conflictCount > 0 && (
          <div className="mb-4">
            <Badge variant="destructive" className="flex items-center gap-2 w-fit">
              <AlertTriangle className="w-4 h-4" />
              {conflictCount} conflit{conflictCount > 1 ? 's' : ''} détecté{conflictCount > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Rechercher événements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {!isTechnicianView && (
            <Select value={filters.technician} onValueChange={(val) => setFilters({ ...filters, technician: val })}>
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
          )}

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="resource">Ressources</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="flex-1 overflow-hidden">
        {view === "day" && (
          <DayView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            technicians={transformedTechnicians}
          />
        )}
        {view === "week" && (
          <WeekView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            technicians={transformedTechnicians}
          />
        )}
        {view === "month" && (
          <MonthView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEventClick={handleEventClick}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEventClick={handleEventClick}
          />
        )}
        {view === "resource" && (
          <ResourceView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            technicians={transformedTechnicians}
          />
        )}
      </div>

      {/* Dialogs */}
      {showEventDialog && (
        <ScheduleEventDialog
          open={showEventDialog}
          onClose={() => {
            setShowEventDialog(false);
            setSelectedEvent(null);
            setEventType(null);
          }}
          event={selectedEvent}
          eventType={eventType}
          technicians={transformedTechnicians}
          onSave={(eventId, eventType, data) => handleEventUpdate(eventId, eventType, data)}
        />
      )}

      {conflicts.length > 0 && (
        <ConflictAlert
          conflicts={conflicts}
          onClose={() => setConflicts([])}
        />
      )}

      {showAIDialog && (
        <AIOptimizationDialog
          open={showAIDialog}
          onClose={() => setShowAIDialog(false)}
          events={allEvents}
          technicians={transformedTechnicians}
        />
      )}
    </div>
  );
}

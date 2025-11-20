import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Plus, Filter, AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

  // Fetch data
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: serviceCalls = [] } = useQuery({
    queryKey: ['serviceCalls'],
    queryFn: () => base44.entities.ServiceCall.list(),
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

  // Check if user is technician
  const currentTech = technicians.find(t => t.email === currentUser?.email);
  const isTechnicianView = currentTech && currentUser?.role !== 'admin';

  // Mutations
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const updateServiceCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceCall.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
    },
  });

  // Transform data into calendar events
  const allEvents = useMemo(() => {
    const jobEvents = jobs.map(job => ({
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

    const callEvents = serviceCalls.map(call => ({
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
  }, [jobs, serviceCalls]);

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

  // Conflict detection
  const detectConflicts = (event, newStart, newEnd, newTechnicianIds) => {
    const conflicts = [];
    const techIds = newTechnicianIds || event.technicians.map(t => t.id);

    techIds.forEach(techId => {
      const tech = technicians.find(t => t.id === techId);
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

      // Check working hours (if defined)
      if (tech.working_hours) {
        const startHour = newStart.getHours();
        const endHour = newEnd.getHours();
        // Placeholder - working_hours structure would need to be defined
        // Example: { start: 8, end: 17 }
      }
    });

    return conflicts;
  };

  // Handle event drop/resize
  const handleEventChange = async (event, newStart, newEnd, newTechnicianIds) => {
    const detectedConflicts = detectConflicts(event, newStart, newEnd, newTechnicianIds);
    
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      
      // Send conflict notifications
      for (const conflict of detectedConflicts) {
        try {
          await base44.functions.invoke('sendNotification', {
            type: 'conflict',
            event_id: event.id,
            event_type: event.type,
            conflict_data: {
              message: conflict.message,
              technician_id: conflict.technician?.id
            }
          });
        } catch (err) {
          console.error('Failed to send conflict notification:', err);
        }
      }
      
      return false; // Prevent change
    }

    const oldTechIds = event.technicians.map(t => t.id);
    const updateData = {
      start_date: newStart.toISOString(),
      due_date: newEnd.toISOString(),
    };

    if (newTechnicianIds) {
      const newTechs = technicians.filter(t => newTechnicianIds.includes(t.id)).map(t => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        time_spent: 0,
        time_logs: []
      }));
      updateData.technicians = newTechs;

      // Send assignment notifications for new technicians
      const addedTechIds = newTechnicianIds.filter(id => !oldTechIds.includes(id));
      if (addedTechIds.length > 0) {
        try {
          await base44.functions.invoke('sendNotification', {
            type: 'assignment',
            event_id: event.id,
            event_type: event.type,
            technician_ids: addedTechIds
          });
        } catch (err) {
          console.error('Failed to send assignment notification:', err);
        }
      }
    }

    if (event.type === 'job') {
      await updateJobMutation.mutateAsync({ id: event.id, data: updateData });
    } else {
      await updateServiceCallMutation.mutateAsync({ id: event.id, data: updateData });
    }

    return true;
  };

  // Handle create event
  const handleCreateEvent = (start, technicianId = null) => {
    setSelectedEvent({
      start,
      end: new Date(start.getTime() + 2 * 60 * 60 * 1000), // 2 hours default
      technicians: technicianId ? [{ id: technicianId }] : []
    });
    setEventType(null);
    setShowEventDialog(true);
  };

  // Handle edit event
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEventType(event.type);
    setShowEventDialog(true);
  };

  // Navigate dates
  const goToToday = () => setSelectedDate(new Date());
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };
  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const canEdit = !isTechnicianView || currentUser?.role === 'admin';

  // Get date range for AI optimization
  const getDateRangeForView = () => {
    if (view === 'day') {
      return {
        start: format(selectedDate, 'yyyy-MM-dd'),
        end: format(selectedDate, 'yyyy-MM-dd')
      };
    } else if (view === 'week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd')
      };
    } else {
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      return {
        start: format(monthStart, 'yyyy-MM-dd'),
        end: format(monthEnd, 'yyyy-MM-dd')
      };
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500 mt-1">Manage jobs and service calls</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAIDialog(true)}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <strong>Smart Schedule</strong>
            </Button>
            <Button
              onClick={() => {
                setEventType('job');
                setSelectedEvent({ start: new Date(), technicians: [] });
                setShowEventDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              <strong>New Job</strong>
            </Button>
            <Button
              onClick={() => {
                setEventType('service_call');
                setSelectedEvent({ start: new Date(), technicians: [] });
                setShowEventDialog(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              <strong>New Service Call</strong>
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by title, client, address, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {!isTechnicianView && (
            <Select value={filters.technician} onValueChange={(v) => setFilters({...filters, technician: v})}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Technicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="job">Jobs Only</SelectItem>
              <SelectItem value="service_call">Service Calls Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(v) => setFilters({...filters, priority: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredEvents.length !== allEvents.length && (
          <div className="text-sm text-slate-600">
            Showing {filteredEvents.length} of {allEvents.length} events
          </div>
        )}
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToPrevious}>←</Button>
            <Button variant="outline" onClick={goToToday}><strong>Today</strong></Button>
            <Button variant="outline" onClick={goToNext}>→</Button>
            <span className="ml-4 font-semibold text-lg">
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric',
                ...(view === 'day' ? { day: 'numeric' } : {})
              })}
            </span>
          </div>

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="day"><strong>Day</strong></TabsTrigger>
              <TabsTrigger value="week"><strong>Week</strong></TabsTrigger>
              <TabsTrigger value="month"><strong>Month</strong></TabsTrigger>
              <TabsTrigger value="agenda"><strong>Agenda</strong></TabsTrigger>
              <TabsTrigger value="resource"><strong>Resource</strong></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <ConflictAlert 
          conflicts={conflicts} 
          onClose={() => setConflicts([])}
        />
      )}

      {/* Calendar Views */}
      <div className="bg-white rounded-lg border">
        {view === 'day' && (
          <DayView
            date={selectedDate}
            events={filteredEvents}
            technicians={isTechnicianView ? [currentTech] : technicians}
            onEventChange={handleEventChange}
            onEventClick={handleEditEvent}
            onSlotClick={canEdit ? handleCreateEvent : null}
            readOnly={!canEdit}
          />
        )}

        {view === 'week' && (
          <WeekView
            date={selectedDate}
            events={filteredEvents}
            technicians={technicians}
            onEventChange={handleEventChange}
            onEventClick={handleEditEvent}
            onSlotClick={canEdit ? handleCreateEvent : null}
            readOnly={!canEdit}
          />
        )}

        {view === 'month' && (
          <MonthView
            date={selectedDate}
            events={filteredEvents}
            onEventClick={handleEditEvent}
            onDayClick={canEdit ? (date) => handleCreateEvent(date) : null}
          />
        )}

        {view === 'agenda' && (
          <AgendaView
            events={filteredEvents}
            onEventClick={handleEditEvent}
            startDate={selectedDate}
          />
        )}

        {view === 'resource' && (
          <ResourceView
            date={selectedDate}
            events={filteredEvents}
            technicians={isTechnicianView ? [currentTech] : technicians}
            onEventChange={handleEventChange}
            onEventClick={handleEditEvent}
            onSlotClick={canEdit ? handleCreateEvent : null}
            readOnly={!canEdit}
          />
        )}
      </div>

      {/* Event Dialog */}
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
          technicians={technicians}
          onDetectConflicts={detectConflicts}
        />
      )}

      {/* AI Optimization Dialog */}
      {showAIDialog && (
        <AIOptimizationDialog
          open={showAIDialog}
          onClose={() => setShowAIDialog(false)}
          dateRange={getDateRangeForView()}
          onApply={() => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
          }}
        />
      )}
      </div>
      );
      }
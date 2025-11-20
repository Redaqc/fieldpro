import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Briefcase, Phone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ScheduleEventDialog({ 
  open, 
  onClose, 
  event, 
  eventType,
  technicians,
  onDetectConflicts 
}) {
  const [type, setType] = useState(eventType || 'job');
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    address: '',
    description: '',
    start: new Date(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000),
    priority: 'medium',
    status: 'todo',
    technician_ids: []
  });
  const [conflicts, setConflicts] = useState([]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        client_name: event.client_name || '',
        address: event.address || '',
        description: event.data?.description || '',
        start: event.start || new Date(),
        end: event.end || new Date(Date.now() + 2 * 60 * 60 * 1000),
        priority: event.priority || 'medium',
        status: event.status || 'todo',
        technician_ids: event.technicians?.map(t => t.id) || []
      });
      if (event.type) setType(event.type);
    }
  }, [event]);

  const createJobMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onClose();
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onClose();
    },
  });

  const createServiceCallMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
      onClose();
    },
  });

  const updateServiceCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceCall.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
      onClose();
    },
  });

  const handleSave = async () => {
    // Check conflicts
    if (onDetectConflicts) {
      const detectedConflicts = onDetectConflicts(
        event || { id: 'new', technicians: [] },
        formData.start,
        formData.end,
        formData.technician_ids
      );
      
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        return;
      }
    }

    const technicianObjects = technicians
      .filter(t => formData.technician_ids.includes(t.id))
      .map(t => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        time_spent: 0,
        time_logs: []
      }));

    const saveData = {
      title: formData.title,
      customer_name: formData.client_name,
      location: formData.address,
      description: formData.description,
      start_date: formData.start.toISOString(),
      due_date: formData.end.toISOString(),
      priority: formData.priority,
      status: formData.status,
      technicians: technicianObjects,
    };

    const oldStatus = event?.status;
    const isStatusChanged = event?.id && oldStatus !== formData.status;
    const oldTechIds = event?.technicians?.map(t => t.id) || [];
    const newTechIds = formData.technician_ids;
    const addedTechIds = newTechIds.filter(id => !oldTechIds.includes(id));

    let savedEvent;
    if (event?.id) {
      // Update existing
      if (type === 'job') {
        savedEvent = await updateJobMutation.mutateAsync({ id: event.id, data: saveData });
      } else {
        savedEvent = await updateServiceCallMutation.mutateAsync({ id: event.id, data: saveData });
      }

      // Send status change notification
      if (isStatusChanged) {
        try {
          await base44.functions.invoke('sendNotification', {
            type: 'status_change',
            event_id: event.id,
            event_type: type,
            status_change: { old_status: oldStatus, new_status: formData.status }
          });
        } catch (err) {
          console.error('Failed to send status notification:', err);
        }
      }

      // Send assignment notifications for new technicians
      if (addedTechIds.length > 0) {
        try {
          await base44.functions.invoke('sendNotification', {
            type: 'assignment',
            event_id: event.id,
            event_type: type,
            technician_ids: addedTechIds
          });
        } catch (err) {
          console.error('Failed to send assignment notification:', err);
        }
      }
    } else {
      // Create new
      if (type === 'job') {
        savedEvent = await createJobMutation.mutateAsync(saveData);
      } else {
        savedEvent = await createServiceCallMutation.mutateAsync(saveData);
      }

      // Send assignment notifications for new event
      if (newTechIds.length > 0 && savedEvent) {
        try {
          await base44.functions.invoke('sendNotification', {
            type: 'assignment',
            event_id: savedEvent.data?.id || event.id,
            event_type: type,
            technician_ids: newTechIds
          });
        } catch (err) {
          console.error('Failed to send assignment notification:', err);
        }
      }
    }
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event?.id ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Selection (only for new events) */}
          {!event?.id && (
            <div>
              <Label>Event Type</Label>
              <Tabs value={type} onValueChange={setType} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="job" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <strong>Job</strong>
                  </TabsTrigger>
                  <TabsTrigger value="service_call" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <strong>Service Call</strong>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Scheduling Conflicts Detected</h4>
                  {conflicts.map((conflict, idx) => (
                    <p key={idx} className="text-sm text-red-700">{conflict.message}</p>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setConflicts([])}
                    className="mt-2"
                  >
                    Override
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
            />
          </div>

          <div>
            <Label>Client Name</Label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Client name"
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Job site address"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formatDateTimeLocal(formData.start)}
                onChange={(e) => setFormData({ ...formData, start: new Date(e.target.value) })}
              />
            </div>

            <div>
              <Label>End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formatDateTimeLocal(formData.end)}
                onChange={(e) => setFormData({ ...formData, end: new Date(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assign Technicians</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {technicians.map(tech => (
                <label key={tech.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.technician_ids.includes(tech.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ 
                          ...formData, 
                          technician_ids: [...formData.technician_ids, tech.id] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          technician_ids: formData.technician_ids.filter(id => id !== tech.id) 
                        });
                      }
                    }}
                  />
                  <span>{tech.first_name} {tech.last_name}</span>
                  <span className="text-xs text-slate-600">({tech.role})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title || conflicts.length > 0}
              className={type === 'job' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
            >
              <strong>{event?.id ? 'Update' : 'Create'}</strong>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
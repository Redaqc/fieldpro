import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CheckSquare, Paperclip, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: 'todo', title: 'À faire', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'En cours', color: 'bg-blue-100' },
  { id: 'review', title: 'En révision', color: 'bg-purple-100' },
  { id: 'completed', title: 'Terminé', color: 'bg-green-100' },
  { id: 'archived', title: 'Archivé', color: 'bg-gray-100' },
];

export default function KanbanBoard({ jobs, onEditJob, currentUser }) {
  const queryClient = useQueryClient();

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const jobId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const job = jobs.find(j => j.id === jobId);

    if (job.status === newStatus) return;

    const updates = {
      status: newStatus,
      activity_log: [
        ...(job.activity_log || []),
        {
          timestamp: new Date().toISOString(),
          user: currentUser?.email || 'System',
          action: 'status_changed',
          details: `Statut changé de "${job.status}" à "${newStatus}"`,
        },
      ],
    };

    if (newStatus === 'completed' && !job.completed_at) {
      updates.completed_at = new Date().toISOString();
      updates.activity_log.push({
        timestamp: new Date().toISOString(),
        user: currentUser?.email || 'System',
        action: 'completed',
        details: 'Job marqué comme terminé',
      });
    }

    updateJobMutation.mutate({ id: jobId, data: updates });
  };

  const getJobsByStatus = (status) => {
    return jobs.filter(j => j.status === status).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const isOverdue = (job) => {
    if (!job.due_date || job.status === 'completed') return false;
    return new Date(job.due_date) < new Date();
  };

  const getChecklistProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return null;
    const allItems = checklist.flatMap(group => group.items || []);
    const completed = allItems.filter(item => item.completed).length;
    return { completed, total: allItems.length };
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {COLUMNS.map(column => {
          const columnJobs = getJobsByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`${column.color} rounded-t-lg px-4 py-3`}>
                <h3 className="font-semibold text-slate-900">
                  {column.title}
                  <span className="ml-2 text-sm text-slate-600">({columnJobs.length})</span>
                </h3>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-2 rounded-b-lg ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-slate-50'
                    }`}
                    style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}
                  >
                    {columnJobs.map((job, index) => {
                      const checklistProgress = getChecklistProgress(job.checklist);
                      const overdue = isOverdue(job);

                      return (
                        <Draggable key={job.id} draggableId={job.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              }`}
                              onClick={() => onEditJob(job)}
                            >
                              {/* Work Type Badge */}
                              {job.work_type_name && (
                                <div className="mb-2">
                                  <Badge 
                                    className="text-white text-xs"
                                    style={{ backgroundColor: job.work_type_color || '#0074D9' }}
                                  >
                                    {job.work_type_name}
                                  </Badge>
                                </div>
                              )}

                              {/* Labels */}
                              {job.labels && job.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {job.labels.map((label, idx) => (
                                    <div 
                                      key={idx} 
                                      className="h-2 w-12 rounded-full"
                                      style={{ backgroundColor: label.color }}
                                      title={label.name}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Title */}
                              <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                                {job.title}
                              </h4>

                              {/* Metadata */}
                              <div className="space-y-2 text-xs">
                                {/* Priority & Overdue */}
                                <div className="flex items-center gap-2">
                                  {job.priority && (
                                    <Badge className={priorityColors[job.priority]}>
                                      {job.priority}
                                    </Badge>
                                  )}
                                  {overdue && (
                                    <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      En retard
                                    </Badge>
                                  )}
                                </div>

                                {/* Due Date */}
                                {job.due_date && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <Calendar className="w-3 h-3" />
                                    <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                                      {format(new Date(job.due_date), 'dd MMM yyyy')}
                                    </span>
                                  </div>
                                )}

                                {/* Checklist Progress */}
                                {checklistProgress && checklistProgress.total > 0 && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>
                                      {checklistProgress.completed}/{checklistProgress.total}
                                    </span>
                                  </div>
                                )}

                                {/* Attachments */}
                                {job.attachments && job.attachments.length > 0 && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{job.attachments.length}</span>
                                  </div>
                                )}

                                {/* Assigned Technicians */}
                                {job.technicians && job.technicians.length > 0 && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <User className="w-3 h-3" />
                                    <span className="text-xs">{job.technicians.length} tech{job.technicians.length > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                                {!job.technicians && job.technician_name && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <User className="w-3 h-3" />
                                    <span className="text-xs">{job.technician_name}</span>
                                  </div>
                                )}
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
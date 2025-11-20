import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CheckSquare, Paperclip, AlertCircle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: 'new', title: 'À faire', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'En cours', color: 'bg-blue-100' },
  { id: 'review', title: 'En révision', color: 'bg-purple-100' },
  { id: 'completed', title: 'Terminé', color: 'bg-green-100' },
  { id: 'cancelled', title: 'Archivé', color: 'bg-gray-100' },
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
    return jobs.filter(j => {
      const jobStatus = j.status || 'new';
      // Pour la colonne "À faire", inclure aussi les statuts vides, null, undefined
      if (status === 'new') {
        return !j.status || j.status === 'new' || j.status === '';
      }
      return jobStatus === status;
    }).sort((a, b) => 
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
                             className={`mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                               snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-400 scale-105' : ''
                             } bg-white`}
                             onClick={() => onEditJob(job)}
                           >
                             {/* Header with Job Number */}
                             <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                               <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                                 <span>Job ID: {job.job_number || job.id.slice(0, 5)}</span>
                               </div>
                             </div>

                             {/* Content */}
                             <div className="p-4 space-y-3">
                               {/* Client */}
                               {job.customer_name && (
                                 <div className="flex items-center gap-2 text-sm text-slate-700">
                                   <User className="w-4 h-4 text-slate-400" />
                                   <span className="font-medium">{job.customer_name}</span>
                                 </div>
                               )}

                               {/* Scheduled */}
                               {(job.start_date || job.due_date) && (
                                 <div className="flex items-center gap-2 text-xs text-slate-600">
                                   <Calendar className="w-4 h-4 text-slate-400" />
                                   <span>
                                     {job.start_date && format(new Date(job.start_date), 'MMM d')}
                                     {job.start_date && job.due_date && ' - '}
                                     {job.due_date && format(new Date(job.due_date), 'MMM d, yyyy')}
                                   </span>
                                 </div>
                               )}



                               {/* Title */}
                               <h4 className="font-bold text-base text-slate-900 line-clamp-2 leading-tight">
                                 {job.title}
                               </h4>

                               {/* Address */}
                               {(job.location || job.project_addresses?.[0]) && (
                                 <div className="flex items-start gap-2 text-xs text-slate-600">
                                   <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                   <span className="line-clamp-2">{job.location || job.project_addresses[0]}</span>
                                 </div>
                               )}

                               {/* Assigned Tech */}
                               {job.technicians && job.technicians.length > 0 && (
                                 <div className="flex items-center gap-2 text-xs text-slate-600">
                                   <User className="w-4 h-4 text-slate-400" />
                                   <span className="font-medium">{job.technicians.map(t => t.name).join(', ')}</span>
                                 </div>
                               )}
                             </div>

                             {/* Footer with Labels */}
                             {job.labels && job.labels.length > 0 && (
                               <div className="px-4 pb-3 flex flex-wrap gap-1">
                                 {job.labels.map((label, idx) => (
                                   <Badge 
                                     key={idx}
                                     className="text-white text-xs font-medium"
                                     style={{ backgroundColor: label.color }}
                                   >
                                     {label.name}
                                   </Badge>
                                 ))}
                               </div>
                             )}
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
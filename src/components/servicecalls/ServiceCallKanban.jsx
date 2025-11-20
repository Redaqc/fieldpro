import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CheckSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: 'todo', title: 'À faire', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'En cours', color: 'bg-blue-100' },
  { id: 'review', title: 'En révision', color: 'bg-purple-100' },
  { id: 'completed', title: 'Terminé', color: 'bg-green-100' },
];

export default function ServiceCallKanban({ calls, onEditCall, currentUser }) {
  const queryClient = useQueryClient();

  const updateCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceCall.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
    },
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const callId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const call = calls.find(c => c.id === callId);

    if (call.status === newStatus) return;

    const updates = {
      status: newStatus,
      activity_log: [
        ...(call.activity_log || []),
        {
          timestamp: new Date().toISOString(),
          user: currentUser?.email || 'System',
          action: 'status_changed',
          details: `Statut changé de "${call.status}" à "${newStatus}"`,
        },
      ],
    };

    if (newStatus === 'completed' && !call.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    updateCallMutation.mutate({ id: callId, data: updates });
  };

  const getCallsByStatus = (status) => {
    return calls.filter(c => c.status === status).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const isOverdue = (call) => {
    if (!call.due_date || call.status === 'completed') return false;
    return new Date(call.due_date) < new Date();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {COLUMNS.map(column => {
          const columnCalls = getCallsByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`${column.color} rounded-t-lg px-4 py-3`}>
                <h3 className="font-semibold text-slate-900">
                  {column.title}
                  <span className="ml-2 text-sm text-slate-600">({columnCalls.length})</span>
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
                    {columnCalls.map((call, index) => {
                      const overdue = isOverdue(call);

                      return (
                        <Draggable key={call.id} draggableId={call.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              }`}
                              onClick={() => onEditCall(call)}
                            >
                              {call.work_type_name && (
                                <div className="mb-2">
                                  <Badge 
                                    className="text-white text-xs"
                                    style={{ backgroundColor: call.work_type_color || '#0074D9' }}
                                  >
                                    {call.work_type_name}
                                  </Badge>
                                </div>
                              )}

                              <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                                {call.title}
                              </h4>

                              <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                  {call.priority && (
                                    <Badge className={priorityColors[call.priority]}>
                                      {call.priority}
                                    </Badge>
                                  )}
                                  {overdue && (
                                    <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      En retard
                                    </Badge>
                                  )}
                                </div>

                                {call.due_date && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <Calendar className="w-3 h-3" />
                                    <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                                      {format(new Date(call.due_date), 'dd MMM yyyy')}
                                    </span>
                                  </div>
                                )}

                                {call.technicians && call.technicians.length > 0 && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <User className="w-3 h-3" />
                                    <span>{call.technicians.length} tech</span>
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
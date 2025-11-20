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
      <div className="flex gap-6 p-6 h-full overflow-x-auto pb-8">
        {COLUMNS.map(column => {
          const columnCalls = getCallsByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`${column.color} rounded-t-xl px-4 py-3 border-b-2 border-slate-200`}>
                <h3 className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{column.title}</span>
                  <span className="text-sm bg-white px-2 py-0.5 rounded-full font-semibold text-slate-700 shadow-sm">
                    {columnCalls.length}
                  </span>
                </h3>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-3 rounded-b-xl transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50/50'
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
                              className={`mb-3 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 ${
                                snapshot.isDragging ? 'shadow-2xl rotate-3 scale-105 ring-2 ring-blue-400' : ''
                              }`}
                              style={{
                                borderLeftColor: call.work_type_color || '#0074D9',
                                ...provided.draggableProps.style
                              }}
                              onClick={() => onEditCall(call)}
                            >
                              <div className="space-y-3">
                                {call.work_type_name && (
                                  <Badge 
                                    className="text-white text-xs font-medium shadow-sm"
                                    style={{ backgroundColor: call.work_type_color || '#0074D9' }}
                                  >
                                    {call.work_type_name}
                                  </Badge>
                                )}

                                <h4 className="font-bold text-base mb-2 line-clamp-2 leading-tight text-slate-900">
                                  {call.title}
                                </h4>

                                {call.customer_name && (
                                  <p className="text-xs text-slate-600 font-medium">
                                    👤 {call.customer_name}
                                  </p>
                                )}

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {call.priority && (
                                      <Badge className={`${priorityColors[call.priority]} text-xs font-medium`}>
                                        {call.priority === 'low' ? '🔵 Basse' : 
                                         call.priority === 'medium' ? '🟡 Moyenne' : 
                                         call.priority === 'high' ? '🟠 Haute' : '🔴 Urgente'}
                                      </Badge>
                                    )}
                                    {overdue && (
                                      <Badge className="bg-red-500 text-white flex items-center gap-1 shadow-sm">
                                        <AlertCircle className="w-3 h-3" />
                                        En retard
                                      </Badge>
                                    )}
                                  </div>

                                  {call.due_date && (
                                    <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                                      <Calendar className="w-3.5 h-3.5" />
                                      {format(new Date(call.due_date), 'dd MMM yyyy')}
                                    </div>
                                  )}

                                  {call.technicians && call.technicians.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <User className="w-3.5 h-3.5" />
                                      <span className="font-medium">{call.technicians.length} technicien{call.technicians.length > 1 ? 's' : ''}</span>
                                    </div>
                                  )}

                                  {call.total_time_spent > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                                      ⏱️ {call.total_time_spent}h
                                    </div>
                                  )}
                                </div>
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
import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CheckSquare, AlertCircle, MapPin, Edit } from "lucide-react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: 'new', title: 'À faire', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'En cours', color: 'bg-blue-100' },
  { id: 'review', title: 'En révision', color: 'bg-purple-100' },
  { id: 'completed', title: 'Terminé', color: 'bg-green-100' },
  { id: 'cancelled', title: 'Archivé', color: 'bg-slate-100' },
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
    return calls.filter(c => {
      const callStatus = c.status || 'new';
      // Pour la colonne "À faire", inclure aussi les statuts vides, null, undefined
      if (status === 'new') {
        return !c.status || c.status === 'new' || c.status === '';
      }
      return callStatus === status;
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

  const isOverdue = (call) => {
    if (!call.due_date || call.status === 'completed') return false;
    return new Date(call.due_date) < new Date();
  };

  // Debug: Afficher les appels dans la console
  React.useEffect(() => {
    console.log('Total service calls:', calls.length);
    console.log('Service calls data:', calls);
    COLUMNS.forEach(column => {
      const columnCalls = getCallsByStatus(column.id);
      console.log(`${column.title} (${column.id}):`, columnCalls.length, 'calls');
    });
  }, [calls]);

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
                             className={`mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                               snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-400 scale-105' : ''
                             } bg-white`}
                             style={provided.draggableProps.style}
                             onClick={() => onEditCall(call)}
                           >
                             {/* Header with Job ID and edit icon */}
                             <div className="px-3 pt-3 pb-2 border-b border-slate-100">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs text-slate-500 font-semibold">Job ID: {call.call_number || call.id.slice(0, 5)}</span>
                                 <Edit className="w-3 h-3 text-slate-400" />
                               </div>
                             </div>

                             {/* Content */}
                             <div className="p-3 space-y-3">
                               {/* Client */}
                               {call.customer_name && (
                                 <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1">CLIENT</p>
                                   <div className="flex items-center gap-2 text-sm text-slate-700">
                                     <User className="w-4 h-4 text-slate-400" />
                                     <span className="font-medium">{call.customer_name}</span>
                                   </div>
                                 </div>
                               )}

                               {/* Scheduled */}
                               {(call.start_date || call.due_date) && (
                                 <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1">SCHEDULED</p>
                                   <div className="flex items-center gap-2 text-xs text-slate-600">
                                     <Calendar className="w-4 h-4 text-slate-400" />
                                     <span>
                                       {call.start_date && format(new Date(call.start_date), 'EEE MMM d h:mm a')}
                                       {call.start_date && call.due_date && ' - '}
                                       {call.due_date && !call.start_date && format(new Date(call.due_date), 'EEE MMM d h:mm a')}
                                       {call.due_date && call.start_date && format(new Date(call.due_date), 'h:mm a')}
                                     </span>
                                   </div>
                                 </div>
                               )}



                               {/* Title */}
                               <h4 className="font-bold text-base text-slate-900 line-clamp-2 leading-tight">
                                 {call.title}
                               </h4>

                               {/* Address */}
                               {(call.location || call.project_addresses?.[0]) && (
                                 <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1">ADDRESS</p>
                                   <div className="flex items-start gap-2 text-xs text-slate-600">
                                     <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                     <span className="line-clamp-2">{call.location || call.project_addresses[0]}</span>
                                   </div>
                                 </div>
                               )}

                               {/* Assigned Tech */}
                               {call.technicians && call.technicians.length > 0 && (
                                 <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-1">ASSIGNED TECH</p>
                                   <div className="flex items-center gap-2 text-xs text-slate-600">
                                     <User className="w-4 h-4 text-slate-400" />
                                     <span className="font-medium">{call.technicians.map(t => t.name).join(', ')}</span>
                                   </div>
                                 </div>
                               )}
                             </div>

                             {/* Footer with Labels */}
                             {call.labels && call.labels.length > 0 && (
                               <div className="px-3 pb-3 flex flex-wrap gap-1">
                                 {call.labels.map((label, idx) => (
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
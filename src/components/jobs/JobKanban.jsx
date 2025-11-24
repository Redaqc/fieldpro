import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Paperclip, CheckSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { JOB_STATUS, JOB_STATUS_LABELS, PRIORITY } from '@/constants/statuses';

/**
 * AUDIT FIX: High Priority Issue #7 - Standardize Status Values
 * Fixed: 'to_do' → 'todo' (removed underscore)
 * Now using JOB_STATUS and PRIORITY constants for consistency
 */

const columns = [
  { id: JOB_STATUS.TODO, title: JOB_STATUS_LABELS[JOB_STATUS.TODO], color: 'bg-slate-100' },
  { id: JOB_STATUS.IN_PROGRESS, title: JOB_STATUS_LABELS[JOB_STATUS.IN_PROGRESS], color: 'bg-blue-100' },
  { id: JOB_STATUS.REVIEW, title: JOB_STATUS_LABELS[JOB_STATUS.REVIEW], color: 'bg-yellow-100' },
  { id: JOB_STATUS.COMPLETED, title: JOB_STATUS_LABELS[JOB_STATUS.COMPLETED], color: 'bg-green-100' },
];

const priorityColors = {
  [PRIORITY.LOW]: 'bg-slate-500',
  [PRIORITY.MEDIUM]: 'bg-blue-500',
  [PRIORITY.HIGH]: 'bg-orange-500',
  [PRIORITY.URGENT]: 'bg-red-500',
};

export default function JobKanban({ jobs, isLoading, onJobClick, onUpdate }) {
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const jobId = draggableId;
    const newStatus = destination.droppableId;
    
    const job = jobs.find(j => j.id === jobId);
    if (job && job.status !== newStatus) {
      const updates = {
        ...job,
        status: newStatus,
        activity_log: [
          ...(job.activity_log || []),
          {
            action: 'status_changed',
            user_name: 'User',
            timestamp: new Date().toISOString(),
            details: `Status changed from ${job.status} to ${newStatus}`
          }
        ]
      };

      if (newStatus === JOB_STATUS.COMPLETED && !job.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
      
      onUpdate({ id: jobId, data: updates });
    }
  };

  const getJobsByStatus = (status) => {
    return jobs.filter(job => job.status === status);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg p-4 min-h-[600px] ${column.color} ${
                  snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">{column.title}</h3>
                  <Badge variant="secondary">{getJobsByStatus(column.id).length}</Badge>
                </div>
                
                <div className="space-y-3">
                  {getJobsByStatus(column.id).map((job, index) => (
                    <Draggable key={job.id} draggableId={job.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onJobClick(job)}
                          className={`p-3 cursor-pointer hover:shadow-md transition-shadow bg-white ${
                            snapshot.isDragging ? 'opacity-50 rotate-3' : ''
                          }`}
                        >
                          <JobCard job={job} />
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

function JobCard({ job }) {
  const completedItems = (job.checklist || []).filter(i => i.completed).length;
  const totalItems = (job.checklist || []).length;
  const isOverdue = job.due_date && new Date(job.due_date) < new Date() && job.status !== 'completed';

  return (
    <>
      {(job.labels || []).length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {job.labels.slice(0, 3).map((label, i) => (
            <div key={i} className="h-2 w-8 rounded-full bg-purple-500" />
          ))}
        </div>
      )}
      
      <h4 className="font-semibold text-sm mb-2">{job.title}</h4>
      
      {job.priority && job.priority !== 'medium' && (
        <Badge className={`${priorityColors[job.priority]} text-white text-xs mb-2`}>
          {job.priority}
        </Badge>
      )}

      <div className="space-y-2 text-xs text-slate-600">
        {job.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
            <Calendar className="w-3 h-3" />
            {format(new Date(job.due_date), 'MMM d')}
            {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
          </div>
        )}
        
        {(job.assigned_names || []).length > 0 && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {job.assigned_names[0]}
            {job.assigned_names.length > 1 && ` +${job.assigned_names.length - 1}`}
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              {completedItems}/{totalItems}
            </div>
          )}
          
          {(job.attachments || []).length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {job.attachments.length}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
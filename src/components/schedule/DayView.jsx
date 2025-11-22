import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function DayView({ 
  date, 
  events, 
  technicians, 
  onEventChange, 
  onEventClick, 
  onSlotClick,
  readOnly 
}) {
  const [draggedEvent, setDraggedEvent] = useState(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Get events for this day per technician
  const getTechnicianEvents = (techId) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      const isSameDay = eventDate.toDateString() === date.toDateString();
      const hasTech = event.technicians.some(t => t.id === techId);
      return isSameDay && hasTech;
    });
  };

  const handleSlotClick = (hour, techId) => {
    if (!onSlotClick || readOnly) return;
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    onSlotClick(slotDate, techId);
  };

  const handleEventDragStart = (e, event) => {
    if (readOnly) return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEventDrop = async (e, hour, techId) => {
    e.preventDefault();
    if (!draggedEvent || !onEventChange || readOnly) return;

    const newStart = new Date(date);
    newStart.setHours(hour, 0, 0, 0);
    
    const duration = draggedEvent.end - draggedEvent.start;
    const newEnd = new Date(newStart.getTime() + duration);

    const newTechIds = techId ? [techId] : draggedEvent.technicians.map(t => t.id);

    await onEventChange(draggedEvent, newStart, newEnd, newTechIds);
    setDraggedEvent(null);
  };

  const getEventPosition = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    const top = (start.getHours() + start.getMinutes() / 60) * 60; // 60px per hour
    const height = Math.max(((end - start) / (1000 * 60 * 60)) * 60, 30); // min 30px
    
    return { top, height };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(200px,1fr))] border-b bg-slate-50">
          <div className="p-2 text-xs font-semibold text-slate-600">Time</div>
          {technicians.map(tech => (
            <div key={tech.id} className="p-2 border-l">
              <div className="font-semibold">{tech.first_name} {tech.last_name}</div>
              <div className="text-xs text-slate-600">{tech.role}</div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(auto-fit,minmax(200px,1fr))] border-b" style={{ height: '60px' }}>
              <div className="p-2 text-xs text-slate-600 border-r">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              {technicians.map(tech => (
                <div
                  key={`${hour}-${tech.id}`}
                  className="border-l hover:bg-slate-50 cursor-pointer transition-colors relative"
                  onClick={() => handleSlotClick(hour, tech.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleEventDrop(e, hour, tech.id)}
                />
              ))}
            </div>
          ))}

          {/* Events Overlay */}
          {technicians.map((tech, techIndex) => {
            const techEvents = getTechnicianEvents(tech.id);
            return (
              <div
                key={tech.id}
                className="absolute top-0 pointer-events-none"
                style={{ 
                  left: `${60 + (techIndex * (100 / technicians.length))}%`,
                  width: `${100 / technicians.length}%`
                }}
              >
                {techEvents.map(event => {
                  const { top, height } = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      draggable={!readOnly}
                      onDragStart={(e) => handleEventDragStart(e, event)}
                      onClick={() => onEventClick && onEventClick(event)}
                      className={`absolute left-1 right-1 rounded border-l-4 p-2 cursor-pointer hover:shadow-lg transition-all pointer-events-auto ${getPriorityColor(event.priority)}`}
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
                        backgroundColor: event.type === 'job' ? '#eff6ff' : '#f0fdf4'
                      }}
                    >
                      <div className="text-xs font-semibold truncate">{event.title}</div>
                      <div className="text-xs text-slate-600 truncate">{event.client_name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'job' ? 'Job' : 'Call'}
                        </Badge>
                        {event.priority === 'urgent' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
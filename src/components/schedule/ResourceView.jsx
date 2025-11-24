import { useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function ResourceView({ 
  date, 
  events, 
  technicians, 
  onEventChange, 
  onEventClick, 
  onSlotClick,
  readOnly 
}) {
  const [draggedEvent, setDraggedEvent] = useState(null);
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 9pm

  const getTechnicianEventsForDay = (techId, day) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      const isSameDay = eventDate.toDateString() === day.toDateString();
      const hasTech = event.technicians.some(t => t.id === techId);
      return isSameDay && hasTech;
    });
  };

  const handleSlotClick = (day, hour, techId) => {
    if (!onSlotClick || readOnly) return;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    onSlotClick(slotDate, techId);
  };

  const handleEventDragStart = (e, event) => {
    if (readOnly) return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEventDrop = async (e, day, hour, techId) => {
    e.preventDefault();
    if (!draggedEvent || !onEventChange || readOnly) return;

    const newStart = new Date(day);
    newStart.setHours(hour, 0, 0, 0);
    
    const duration = draggedEvent.end - draggedEvent.start;
    const newEnd = new Date(newStart.getTime() + duration);

    await onEventChange(draggedEvent, newStart, newEnd, [techId]);
    setDraggedEvent(null);
  };

  const getEventPosition = (event, day) => {
    const start = new Date(event.start);
    const eventDay = start.toDateString();
    const targetDay = day.toDateString();
    
    if (eventDay !== targetDay) return null;

    const startHour = start.getHours() - 7; // offset by start hour (7am)
    if (startHour < 0 || startHour > 14) return null;

    const end = new Date(event.end);
    const durationHours = (end - start) / (1000 * 60 * 60);
    
    return {
      top: startHour * 60 + (start.getMinutes()),
      height: Math.max(durationHours * 60, 30)
    };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header with days */}
        <div className="flex border-b bg-slate-50">
          <div className="w-40 p-2 text-xs font-semibold text-slate-600 border-r">Technician</div>
          {days.map(day => (
            <div key={day.toISOString()} className="flex-1 p-2 text-center border-l">
              <div className="font-semibold">{format(day, 'EEE')}</div>
              <div className="text-sm">{format(day, 'MMM d')}</div>
            </div>
          ))}
        </div>

        {/* Technician Rows */}
        {technicians.map(tech => (
          <div key={tech.id} className="flex border-b">
            <div className="w-40 p-3 border-r bg-slate-50">
              <div className="font-semibold">{tech.first_name} {tech.last_name}</div>
              <div className="text-xs text-slate-600">{tech.role}</div>
              {tech.color && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color }} />
                </div>
              )}
            </div>

            {days.map((day, dayIndex) => {
              const techEvents = getTechnicianEventsForDay(tech.id, day);
              
              return (
                <div 
                  key={`${tech.id}-${day.toISOString()}`}
                  className="flex-1 border-l relative"
                  style={{ minHeight: '100px' }}
                >
                  {/* Time slots */}
                  <div className="absolute inset-0">
                    {hours.map(hour => (
                      <div
                        key={hour}
                        className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                        style={{ height: '60px' }}
                        onClick={() => handleSlotClick(day, hour, tech.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleEventDrop(e, day, hour, tech.id)}
                      />
                    ))}
                  </div>

                  {/* Events */}
                  {techEvents.map(event => {
                    const position = getEventPosition(event, day);
                    if (!position) return null;

                    return (
                      <div
                        key={event.id}
                        draggable={!readOnly}
                        onDragStart={(e) => handleEventDragStart(e, event)}
                        onClick={() => onEventClick && onEventClick(event)}
                        className="absolute left-1 right-1 rounded border-l-4 p-2 cursor-pointer hover:shadow-lg transition-all z-10"
                        style={{ 
                          top: `${position.top}px`, 
                          height: `${position.height}px`,
                          backgroundColor: event.type === 'job' ? '#eff6ff' : '#f0fdf4',
                          borderLeftColor: event.priority === 'urgent' ? '#ef4444' : event.type === 'job' ? '#3b82f6' : '#10b981'
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
        ))}
      </div>
    </div>
  );
}
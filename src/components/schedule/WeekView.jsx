import React from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function WeekView({ 
  date, 
  events, 
  technicians,
  onEventChange, 
  onEventClick, 
  onSlotClick,
  readOnly 
}) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 9pm

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === day.toDateString();
    });
  };

  const handleSlotClick = (day, hour) => {
    if (!onSlotClick || readOnly) return;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    onSlotClick(slotDate);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b bg-slate-50">
          <div className="p-2 text-xs font-semibold text-slate-600">Time</div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center border-l">
              <div className="font-semibold">{format(day, 'EEE')}</div>
              <div className="text-sm">{format(day, 'MMM d')}</div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div>
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b" style={{ minHeight: '60px' }}>
              <div className="p-2 text-xs text-slate-600 border-r">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              {days.map(day => {
                const dayEvents = getEventsForDay(day).filter(event => {
                  const eventHour = new Date(event.start).getHours();
                  return eventHour === hour;
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border-l p-1 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleSlotClick(day, hour)}
                  >
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick && onEventClick(event);
                        }}
                        className="mb-1 p-1 rounded text-xs cursor-pointer hover:shadow transition-all"
                        style={{ 
                          backgroundColor: event.type === 'job' ? '#dbeafe' : '#dcfce7',
                          borderLeft: `3px solid ${event.priority === 'urgent' ? '#ef4444' : event.type === 'job' ? '#3b82f6' : '#10b981'}`
                        }}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-slate-600 truncate">{event.client_name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {event.type === 'job' ? 'Job' : 'Call'}
                          </Badge>
                          {event.priority === 'urgent' && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
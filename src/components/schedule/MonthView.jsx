import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";

export default function MonthView({ date, events, onEventClick, onDayClick }) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let currentDay = calendarStart;
  while (currentDay <= calendarEnd) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, day);
    });
  };

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="p-4">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-slate-100 p-2 text-center text-sm font-semibold text-slate-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {weeks.map((week, weekIdx) => (
          <React.Fragment key={weekIdx}>
            {week.map(day => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, date);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onDayClick && onDayClick(day)}
                  className={`bg-white p-2 min-h-[120px] cursor-pointer hover:bg-slate-50 transition-colors ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 ${
                    isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-700'
                  }`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick && onEventClick(event);
                        }}
                        className="text-xs p-1 rounded cursor-pointer hover:shadow transition-all truncate"
                        style={{ 
                          backgroundColor: event.type === 'job' ? '#dbeafe' : '#dcfce7',
                          borderLeft: `2px solid ${event.priority === 'urgent' ? '#ef4444' : event.type === 'job' ? '#3b82f6' : '#10b981'}`
                        }}
                      >
                        <div className="font-medium truncate">
                          {format(new Date(event.start), 'h:mm a')} - {event.title}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-600 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
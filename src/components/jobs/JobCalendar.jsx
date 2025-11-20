import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

export default function JobCalendar({ jobs, onJobClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const jobsByDate = useMemo(() => {
    const map = {};
    jobs.forEach(job => {
      if (job.due_date || job.scheduled_date) {
        const date = job.due_date || job.scheduled_date;
        if (!map[date]) map[date] = [];
        map[date].push(job);
      }
    });
    return map;
  }, [jobs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-slate-600 py-2">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayJobs = jobsByDate[dateStr] || [];
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card
              key={day.toString()}
              className={`min-h-[100px] p-2 ${
                !isSameMonth(day, currentDate) ? 'bg-slate-50' : ''
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="text-sm font-semibold mb-1">{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayJobs.slice(0, 3).map(job => (
                  <div
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 truncate"
                  >
                    {job.title}
                  </div>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-slate-500">+{dayJobs.length - 3} more</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
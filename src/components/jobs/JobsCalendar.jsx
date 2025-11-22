import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsCalendar({ jobs, onEditJob }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const jobsByDate = useMemo(() => {
    const map = new Map();
    jobs.forEach(job => {
      if (job.due_date) {
        const dateKey = format(new Date(job.due_date), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey).push(job);
      }
    });
    return map;
  }, [jobs]);

  const getJobsForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return jobsByDate.get(dateKey) || [];
  };

  const priorityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
            {day}
          </div>
        ))}

        {calendarDays.map(day => {
          const dayJobs = getJobsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={day.toString()}
              className={`min-h-32 p-2 ${
                !isCurrentMonth ? 'bg-slate-50' : ''
              } ${isToday ? 'border-blue-500 border-2' : ''}`}
            >
              <div className="text-sm font-semibold mb-2">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayJobs.slice(0, 3).map(job => (
                  <div
                    key={job.id}
                    className="text-xs p-1 rounded bg-white border cursor-pointer hover:shadow-sm"
                    onClick={() => onEditJob(job)}
                  >
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${priorityColors[job.priority]}`} />
                      <span className="truncate font-medium">{job.title}</span>
                    </div>
                  </div>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-slate-500 pl-3">
                    +{dayJobs.length - 3} autres
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
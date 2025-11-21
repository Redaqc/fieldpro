import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function TimeCalendarView({ entries, technicians, startDate, endDate, lang = 'fr' }) {
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const getEntriesForDay = (day) => {
    return entries.filter(entry => isSameDay(new Date(entry.clock_in), day));
  };

  const getTotalHoursForDay = (day) => {
    const dayEntries = getEntriesForDay(day);
    return dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map(day => {
          const dayEntries = getEntriesForDay(day);
          const totalHours = getTotalHoursForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card 
              key={day.toISOString()} 
              className={`${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    {format(day, 'EEE', { locale: lang === 'fr' ? fr : undefined })}
                  </p>
                  <p className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                    {format(day, 'd')}
                  </p>
                  {totalHours > 0 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {totalHours.toFixed(1)}h
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="px-2 py-0 pb-3">
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map(entry => (
                    <div 
                      key={entry.id} 
                      className="text-xs p-2 bg-slate-50 rounded border border-slate-200"
                    >
                      <p className="font-medium truncate">{entry.technician_name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-600">
                          {format(new Date(entry.clock_in), 'HH:mm')}
                        </span>
                        {entry.total_hours && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {entry.total_hours.toFixed(1)}h
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayEntries.length > 3 && (
                    <p className="text-xs text-slate-500 text-center py-1">
                      +{dayEntries.length - 3} {lang === 'fr' ? 'autres' : 'more'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary by Technician */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {lang === 'fr' ? 'Résumé par technicien' : 'Summary by Technician'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {technicians.map(tech => {
              const techEntries = entries.filter(e => e.technician_id === tech.id);
              const techHours = techEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
              const techDays = new Set(techEntries.map(e => format(new Date(e.clock_in), 'yyyy-MM-dd'))).size;

              if (techHours === 0) return null;

              return (
                <div key={tech.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: tech.color || '#64748b' }}
                    >
                      {tech.first_name[0]}{tech.last_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {tech.first_name} {tech.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {techDays} {lang === 'fr' ? 'jours travaillés' : 'days worked'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{techHours.toFixed(1)}h</p>
                    <p className="text-xs text-slate-500">
                      {techEntries.length} {lang === 'fr' ? 'entrées' : 'entries'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
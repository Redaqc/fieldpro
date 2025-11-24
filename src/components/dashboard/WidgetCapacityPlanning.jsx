import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

export default function WidgetCapacityPlanning({ jobs, technicians }) {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const capacityData = useMemo(() => {
    return daysOfWeek.map(day => {
      const dayJobs = jobs.filter(job => {
        if (!job.start_date) return false;
        const jobStart = new Date(job.start_date);
        const jobEnd = job.due_date ? new Date(job.due_date) : jobStart;
        return day >= jobStart && day <= jobEnd;
      });

      const techUtilization = technicians.map(tech => {
        const techJobs = dayJobs.filter(j => 
          j.technicians?.some(t => t.id === tech.id)
        );
        return {
          id: tech.id,
          name: `${tech.first_name} ${tech.last_name}`,
          jobs: techJobs.length,
          status: tech.status
        };
      });

      const availableTechs = techUtilization.filter(t => t.jobs === 0 && t.status === 'available').length;
      const overloadedTechs = techUtilization.filter(t => t.jobs > 3).length;

      return {
        date: format(day, 'EEE MMM d'),
        jobs: dayJobs.length,
        available: availableTechs,
        overloaded: overloadedTechs,
        utilization: technicians.length > 0 
          ? ((technicians.length - availableTechs) / technicians.length * 100).toFixed(0)
          : 0
      };
    });
  }, [jobs, technicians, daysOfWeek]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Weekly Capacity Planning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {capacityData.map((day, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-sm">{day.date}</p>
              <p className="text-xs text-slate-600">{day.jobs} jobs scheduled</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {day.available} available
              </Badge>
              {day.overloaded > 0 && (
                <Badge className="bg-red-500">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {day.overloaded} overloaded
                </Badge>
              )}
              <div className="text-right min-w-[60px]">
                <p className="text-sm font-bold">{day.utilization}%</p>
                <p className="text-xs text-slate-500">utilized</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
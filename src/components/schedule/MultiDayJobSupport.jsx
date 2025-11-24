import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export default function MultiDayJobSupport({ job }) {
  if (!job.start_date || !job.due_date) return null;

  const startDate = new Date(job.start_date);
  const endDate = new Date(job.due_date);
  const durationDays = differenceInDays(endDate, startDate) + 1;

  if (durationDays <= 1) return null;

  const techCount = job.technicians?.length || 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700">
        <Calendar className="w-3 h-3 mr-1" />
        {durationDays} days
      </Badge>
      {techCount > 1 && (
        <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700">
          <Users className="w-3 h-3 mr-1" />
          {techCount} crew
        </Badge>
      )}
      <span className="text-xs text-slate-600">
        {format(startDate, 'MMM d')} → {format(endDate, 'MMM d')}
      </span>
    </div>
  );
}
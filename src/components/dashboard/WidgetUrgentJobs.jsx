import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function WidgetUrgentJobs({ jobs }) {
  const today = new Date();
  
  const urgentJobs = jobs.filter(job => {
    if (job.status === 'completed' || job.status === 'archived') return false;
    
    const isUrgentPriority = job.priority === 'urgent' || job.priority === 'high';
    const isOverdue = job.due_date && new Date(job.due_date) < today;
    const isDueSoon = job.due_date && differenceInDays(new Date(job.due_date), today) <= 3 && differenceInDays(new Date(job.due_date), today) >= 0;
    
    return isUrgentPriority || isOverdue || isDueSoon;
  }).sort((a, b) => {
    // Trier par priorité et date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date);
    }
    return 0;
  }).slice(0, 5);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = (job) => {
    if (!job.due_date) return null;
    
    const daysUntilDue = differenceInDays(new Date(job.due_date), today);
    
    if (daysUntilDue < 0) {
      return (
        <Badge className="bg-red-500 text-white">
          <Clock className="w-3 h-3 mr-1" />
          En retard de {Math.abs(daysUntilDue)}j
        </Badge>
      );
    } else if (daysUntilDue === 0) {
      return <Badge className="bg-orange-500 text-white">Aujourd'hui</Badge>;
    } else if (daysUntilDue <= 3) {
      return (
        <Badge className="bg-orange-400 text-white">
          Dans {daysUntilDue}j
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Jobs Urgents & En Retard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {urgentJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Aucun job urgent</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentJobs.map(job => (
              <div key={job.id} className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm flex-1">{job.title}</h4>
                  {getStatusBadge(job)}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getPriorityColor(job.priority)} variant="outline">
                    {job.priority === 'urgent' ? 'URGENT' : job.priority === 'high' ? 'Haute' : job.priority}
                  </Badge>
                  {job.due_date && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(job.due_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  )}
                  {job.technicians && job.technicians.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {job.technicians.length} tech.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
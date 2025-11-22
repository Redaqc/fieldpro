import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useTranslation } from "@/components/shared/translations";

export default function OverdueJobsWidget({ jobs, lang = 'fr' }) {
  const t = useTranslation(lang);
  const overdueJobs = jobs.filter(job => 
    job.due_date && 
    new Date(job.due_date) < new Date() && 
    job.status !== 'completed' && 
    job.status !== 'cancelled'
  ).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          {t('overdueJobs')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <p className="text-4xl font-bold text-red-900">{overdueJobs.length}</p>
          <p className="text-sm text-red-600 mt-1">{t('jobsNeedAttention')}</p>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {overdueJobs.map(job => {
            const daysOverdue = differenceInDays(new Date(), new Date(job.due_date));
            return (
              <div key={job.id} className="p-3 bg-red-50 rounded-lg border-l-4 border-l-red-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-red-900">{job.title}</p>
                    <p className="text-xs text-red-700">{job.customer_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        {format(new Date(job.due_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-red-600">
                    {daysOverdue}{t('daysLate')}
                  </Badge>
                </div>
                {job.technicians?.length > 0 && (
                  <p className="text-xs text-slate-600 mt-2">
                    {t('assigned')}: {job.technicians.map(t => t.name).join(', ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {overdueJobs.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>{t('noOverdueJobs')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
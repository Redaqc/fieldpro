import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function WidgetOverdueJobs({ jobs = [], onJobClick }) {
  const overdueJobs = jobs.filter(job => {
    if (!job.due_date || job.status === 'completed') return false;
    return new Date(job.due_date) < new Date();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Jobs en Retard ({overdueJobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {overdueJobs.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Aucun job en retard</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {overdueJobs.map(job => (
              <div 
                key={job.id} 
                className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => onJobClick?.(job)}
              >
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-red-600">
                  Échéance: {format(new Date(job.due_date), 'PP', { locale: fr })}
                </p>
                {job.customer_name && (
                  <p className="text-xs text-slate-500">{job.customer_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
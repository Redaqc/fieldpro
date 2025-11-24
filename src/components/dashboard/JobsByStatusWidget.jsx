import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useTranslation } from "@/components/shared/translations";
import { JOB_STATUS } from '@/constants/statuses';

export default function JobsByStatusWidget({ jobs, lang = 'fr' }) {
  const t = useTranslation(lang);
  const statusCounts = {
    new: jobs.filter(j => j.status === JOB_STATUS.NEW).length,
    scheduled: jobs.filter(j => j.status === JOB_STATUS.SCHEDULED).length,
    in_progress: jobs.filter(j => j.status === JOB_STATUS.IN_PROGRESS).length,
    completed: jobs.filter(j => j.status === JOB_STATUS.COMPLETED).length,
  };

  const chartData = [
    { name: lang === 'fr' ? 'Nouveau' : 'New', value: statusCounts.new, color: '#3b82f6' },
    { name: lang === 'fr' ? 'Planifié' : 'Scheduled', value: statusCounts.scheduled, color: '#f59e0b' },
    { name: lang === 'fr' ? 'En Cours' : 'In Progress', value: statusCounts.in_progress, color: '#8b5cf6' },
    { name: lang === 'fr' ? 'Terminé' : 'Completed', value: statusCounts.completed, color: '#10b981' },
  ].filter(item => item.value > 0);

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800">
          {t('jobsByStatus')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
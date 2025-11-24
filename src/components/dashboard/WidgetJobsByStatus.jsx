import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { JOB_STATUS } from '@/constants/statuses';

export default function WidgetJobsByStatus({ jobs = [] }) {
  const statusCounts = {
    todo: jobs.filter(j => j.status === JOB_STATUS.TODO).length,
    in_progress: jobs.filter(j => j.status === JOB_STATUS.IN_PROGRESS).length,
    review: jobs.filter(j => j.status === JOB_STATUS.REVIEW).length,
    completed: jobs.filter(j => j.status === JOB_STATUS.COMPLETED).length,
    archived: jobs.filter(j => j.status === JOB_STATUS.ARCHIVED).length,
  };

  const data = [
    { name: 'À faire', count: statusCounts.todo, fill: '#94a3b8' },
    { name: 'En cours', count: statusCounts.in_progress, fill: '#3b82f6' },
    { name: 'En révision', count: statusCounts.review, fill: '#8b5cf6' },
    { name: 'Terminé', count: statusCounts.completed, fill: '#10b981' },
    { name: 'Archivé', count: statusCounts.archived, fill: '#6b7280' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Jobs par Statut</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
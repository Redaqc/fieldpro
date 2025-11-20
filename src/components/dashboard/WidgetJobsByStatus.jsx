import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WidgetJobsByStatus({ jobs = [] }) {
  const statusCounts = {
    todo: jobs.filter(j => j.status === 'todo').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    review: jobs.filter(j => j.status === 'review').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    archived: jobs.filter(j => j.status === 'archived').length,
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
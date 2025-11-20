import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function JobsByStatusWidget({ jobs }) {
  const statusCounts = {
    new: jobs.filter(j => j.status === 'new').length,
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  const chartData = [
    { name: 'Soumis', value: statusCounts.new, color: '#3b82f6' },
    { name: 'Planifié', value: statusCounts.scheduled, color: '#f59e0b' },
    { name: 'En Cours', value: statusCounts.in_progress, color: '#8b5cf6' },
    { name: 'Terminé', value: statusCounts.completed, color: '#10b981' },
  ].filter(item => item.value > 0);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Jobs par Statut
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-900">{statusCounts.new}</p>
            <p className="text-xs text-blue-600">Soumis</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-900">{statusCounts.scheduled}</p>
            <p className="text-xs text-orange-600">Planifié</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-900">{statusCounts.in_progress}</p>
            <p className="text-xs text-purple-600">En Cours</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-900">{statusCounts.completed}</p>
            <p className="text-xs text-green-600">Terminé</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
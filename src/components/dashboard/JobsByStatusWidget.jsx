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
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800">
          Top Selling Products (2022)
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
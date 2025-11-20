import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function WidgetTasksByTechnician({ jobs, technicians }) {
  const technicianStats = technicians.map(tech => {
    const techJobs = jobs.filter(job => 
      job.technicians?.some(t => t.id === tech.id) &&
      job.status !== 'completed' &&
      job.status !== 'archived'
    );
    
    return {
      name: `${tech.first_name} ${tech.last_name}`,
      value: techJobs.length,
      color: tech.color || '#64748b'
    };
  }).filter(stat => stat.value > 0);

  const totalTasks = technicianStats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-blue-500" />
          Répartition des Tâches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {technicianStats.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Aucune tâche assignée</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={technicianStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {technicianStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {technicianStats.map(stat => (
                <div key={stat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                    <span className="font-medium">{stat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{stat.value} jobs</span>
                    <span className="text-xs text-slate-400">
                      ({((stat.value / totalTasks) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
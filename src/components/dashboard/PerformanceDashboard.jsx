import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, CheckCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PerformanceDashboard({ technicians, jobs, timeEntries }) {
  const performanceData = useMemo(() => {
    return technicians.map(tech => {
      const techJobs = jobs.filter(j => j.technician_id === tech.id);
      const techEntries = timeEntries.filter(e => e.technician_id === tech.id && e.status === 'completed');
      
      const completedJobs = techJobs.filter(j => j.status === 'completed').length;
      const totalJobs = techJobs.length;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs * 100) : 0;
      
      const totalHours = techEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      const avgTimePerJob = completedJobs > 0 ? totalHours / completedJobs : 0;

      return {
        name: `${tech.first_name} ${tech.last_name}`,
        completionRate: Math.round(completionRate),
        avgTime: parseFloat(avgTimePerJob.toFixed(1)),
        totalJobs: completedJobs,
        totalHours: parseFloat(totalHours.toFixed(1)),
        efficiency: completionRate > 80 ? 'Excellent' : completionRate > 60 ? 'Bon' : 'À améliorer',
      };
    });
  }, [technicians, jobs, timeEntries]);

  const jobStatusData = useMemo(() => {
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    return statuses.map(status => ({
      name: status === 'scheduled' ? 'Planifié' : 
            status === 'in_progress' ? 'En cours' :
            status === 'completed' ? 'Complété' : 'Annulé',
      value: jobs.filter(j => j.status === status).length,
    }));
  }, [jobs]);

  const weeklyPerformance = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayJobs = jobs.filter(j => j.scheduled_date === date);
      const completed = dayJobs.filter(j => j.status === 'completed').length;
      
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        completed,
        scheduled: dayJobs.length,
      };
    });
  }, [jobs]);

  const topPerformers = useMemo(() => {
    return [...performanceData]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  }, [performanceData]);

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPerformers.slice(0, 3).map((tech, idx) => (
          <Card key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className={`w-5 h-5 ${idx === 0 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                <span className="font-semibold text-slate-900">{tech.name}</span>
              </div>
              <Badge variant={tech.efficiency === 'Excellent' ? 'default' : 'secondary'}>
                {tech.efficiency}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{tech.completionRate}%</p>
                <p className="text-xs text-slate-600">Taux</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{tech.totalJobs}</p>
                <p className="text-xs text-slate-600">Jobs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{tech.avgTime}h</p>
                <p className="text-xs text-slate-600">Moy/Job</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate by Technician */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Taux de complétion par technicien
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionRate" fill="#3b82f6" name="Taux (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Average Time per Job */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Temps moyen par job
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgTime" fill="#f59e0b" name="Heures" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Weekly Performance Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance hebdomadaire
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Complétés" strokeWidth={2} />
              <Line type="monotone" dataKey="scheduled" stroke="#3b82f6" name="Planifiés" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Job Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition des statuts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance détaillée</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Technicien</th>
                <th className="text-center p-2">Jobs complétés</th>
                <th className="text-center p-2">Taux complétion</th>
                <th className="text-center p-2">Temps moy/job</th>
                <th className="text-center p-2">Heures totales</th>
                <th className="text-center p-2">Efficacité</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((tech, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{tech.name}</td>
                  <td className="text-center p-2">{tech.totalJobs}</td>
                  <td className="text-center p-2">
                    <Badge variant={tech.completionRate >= 80 ? 'default' : 'secondary'}>
                      {tech.completionRate}%
                    </Badge>
                  </td>
                  <td className="text-center p-2">{tech.avgTime}h</td>
                  <td className="text-center p-2">{tech.totalHours}h</td>
                  <td className="text-center p-2">
                    <Badge variant={tech.efficiency === 'Excellent' ? 'default' : 'outline'}>
                      {tech.efficiency}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
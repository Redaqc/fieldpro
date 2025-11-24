import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { TIME_ENTRY_STATUS } from "@/constants/statuses";

export default function OperationalCosts({ technicians, timeEntries, jobs }) {
  const [period, setPeriod] = useState('month');

  const costAnalysis = useMemo(() => {
    return technicians.map(tech => {
      const techEntries = timeEntries.filter(e =>
        e.technician_id === tech.id &&
        e.status === TIME_ENTRY_STATUS.COMPLETED
      );
      
      const totalHours = techEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      const laborCost = totalHours * (tech.hourly_rate || 50);
      const jobCount = jobs.filter(j => j.technician_id === tech.id).length;
      const avgCostPerJob = jobCount > 0 ? laborCost / jobCount : 0;

      return {
        name: `${tech.first_name} ${tech.last_name}`,
        totalHours: parseFloat(totalHours.toFixed(1)),
        laborCost: parseFloat(laborCost.toFixed(2)),
        jobCount,
        avgCostPerJob: parseFloat(avgCostPerJob.toFixed(2)),
        hourlyRate: tech.hourly_rate || 50,
      };
    });
  }, [technicians, timeEntries, jobs]);

  const monthlyCosts = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        date: date,
      };
    });

    return last6Months.map(({ month, date }) => {
      const monthEntries = timeEntries.filter(e => {
        const entryDate = new Date(e.clock_in);
        return entryDate.getMonth() === date.getMonth() &&
               entryDate.getFullYear() === date.getFullYear() &&
               e.status === TIME_ENTRY_STATUS.COMPLETED;
      });

      const totalCost = monthEntries.reduce((sum, e) => {
        const tech = technicians.find(t => t.id === e.technician_id);
        return sum + ((e.total_hours || 0) * (tech?.hourly_rate || 50));
      }, 0);

      const totalHours = monthEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);

      return {
        month,
        cost: parseFloat(totalCost.toFixed(2)),
        hours: parseFloat(totalHours.toFixed(1)),
      };
    });
  }, [timeEntries, technicians]);

  const totals = useMemo(() => {
    const totalCost = costAnalysis.reduce((sum, t) => sum + t.laborCost, 0);
    const totalHours = costAnalysis.reduce((sum, t) => sum + t.totalHours, 0);
    const totalJobs = costAnalysis.reduce((sum, t) => sum + t.jobCount, 0);
    const avgCostPerJob = totalJobs > 0 ? totalCost / totalJobs : 0;

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalJobs,
      avgCostPerJob: parseFloat(avgCostPerJob.toFixed(2)),
    };
  }, [costAnalysis]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Coût total main-d'œuvre</p>
              <p className="text-2xl font-bold text-green-600">${totals.totalCost.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Heures totales</p>
              <p className="text-2xl font-bold text-blue-600">{totals.totalHours}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Coût moyen/job</p>
              <p className="text-2xl font-bold text-purple-600">${totals.avgCostPerJob.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Jobs traités</p>
              <p className="text-2xl font-bold text-orange-600">{totals.totalJobs}</p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labor Cost by Technician */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Coût main-d'œuvre par technicien
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="laborCost" fill="#10b981" name="Coût ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Hours by Technician */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Heures travaillées par technicien
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalHours" fill="#3b82f6" name="Heures" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Cost Trend */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Évolution des coûts mensuels
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyCosts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#10b981" name="Coût ($)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="hours" stroke="#3b82f6" name="Heures" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Cost Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analyse détaillée des coûts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Technicien</th>
                <th className="text-center p-2">Taux horaire</th>
                <th className="text-center p-2">Heures totales</th>
                <th className="text-center p-2">Coût main-d'œuvre</th>
                <th className="text-center p-2">Jobs traités</th>
                <th className="text-center p-2">Coût moy/job</th>
              </tr>
            </thead>
            <tbody>
              {costAnalysis.map((tech, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{tech.name}</td>
                  <td className="text-center p-2">${tech.hourlyRate}/h</td>
                  <td className="text-center p-2">{tech.totalHours}h</td>
                  <td className="text-center p-2 font-semibold text-green-600">
                    ${tech.laborCost.toLocaleString()}
                  </td>
                  <td className="text-center p-2">{tech.jobCount}</td>
                  <td className="text-center p-2">${tech.avgCostPerJob.toFixed(0)}</td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold bg-slate-50">
                <td className="p-2">TOTAL</td>
                <td className="text-center p-2">-</td>
                <td className="text-center p-2">{totals.totalHours}h</td>
                <td className="text-center p-2 text-green-600">${totals.totalCost.toLocaleString()}</td>
                <td className="text-center p-2">{totals.totalJobs}</td>
                <td className="text-center p-2">${totals.avgCostPerJob.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
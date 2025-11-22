import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, Clock, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { JOB_STATUS, INVOICE_STATUS, TIME_ENTRY_STATUS, TECHNICIAN_STATUS } from "@/constants/statuses";

export default function StatsOverview({ jobs, technicians, timeEntries, invoices }) {
  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === JOB_STATUS.COMPLETED).length;
    const inProgressJobs = jobs.filter(j => j.status === JOB_STATUS.IN_PROGRESS).length;
    const scheduledJobs = jobs.filter(j => j.status === JOB_STATUS.SCHEDULED).length;

    const totalRevenue = invoices
      .filter(i => i.status === INVOICE_STATUS.PAID)
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    const totalHours = timeEntries
      .filter(e => e.status === TIME_ENTRY_STATUS.COMPLETED)
      .reduce((sum, e) => sum + (e.total_hours || 0), 0);

    const activeTechs = technicians.filter(t => t.status !== TECHNICIAN_STATUS.OFF_DUTY).length;

    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      scheduledJobs,
      totalRevenue,
      totalHours,
      activeTechs,
      completionRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : 0,
    };
  }, [jobs, technicians, timeEntries, invoices]);

  const weeklyTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayJobs = jobs.filter(j => j.scheduled_date === date);
      const dayRevenue = invoices
        .filter(i => i.issue_date === date && i.status === INVOICE_STATUS.PAID)
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);

      return {
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        jobs: dayJobs.length,
        revenue: dayRevenue,
      };
    });
  }, [jobs, invoices]);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Jobs</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalJobs}</p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.completedJobs} complétés
              </p>
            </div>
            <Briefcase className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Revenus</p>
              <p className="text-3xl font-bold text-green-600">
                ${stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Factures payées</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Heures travaillées</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalHours.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-1">Total enregistré</p>
            </div>
            <Clock className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Techniciens actifs</p>
              <p className="text-3xl font-bold text-orange-600">{stats.activeTechs}</p>
              <p className="text-xs text-slate-500 mt-1">Sur {technicians.length} total</p>
            </div>
            <Users className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Job Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Planifiés</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduledJobs}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressJobs}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Complétés</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedJobs}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendance des jobs (7 jours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="jobs" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenus (7 jours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Taux de complétion global</h3>
            <p className="text-sm text-slate-600">Pourcentage de jobs complétés par rapport au total</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-green-600">{stats.completionRate}%</p>
            <p className="text-sm text-slate-500">{stats.completedJobs} / {stats.totalJobs}</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-slate-200 rounded-full h-4">
          <div 
            className="bg-green-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </Card>
    </div>
  );
}
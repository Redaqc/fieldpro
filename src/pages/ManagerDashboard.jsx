import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function ManagerDashboard() {
  const [timeRange, setTimeRange] = useState('month');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: serviceCalls = [] } = useQuery({
    queryKey: ['serviceCalls'],
    queryFn: () => base44.entities.ServiceCall.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    initialData: [],
  });

  const { data: profitRecords = [] } = useQuery({
    queryKey: ['profitabilityRecords'],
    queryFn: () => base44.entities.ProfitabilityRecord.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const all = await base44.entities.Alert.list('-created_date', 100);
      return all.filter(a => a.status === 'active');
    },
    initialData: [],
  });

  // KPIs Calculation
  const kpis = useMemo(() => {
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const totalJobs = jobs.length;
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    const onTimeJobs = jobs.filter(j => 
      j.status === 'completed' && 
      j.completed_at && 
      j.due_date &&
      new Date(j.completed_at) <= new Date(j.due_date)
    ).length;
    const onTimeRate = completedJobs > 0 ? (onTimeJobs / completedJobs) * 100 : 0;

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalProfit = profitRecords.reduce((sum, rec) => sum + (rec.gross_profit || 0), 0);
    const avgProfitMargin = profitRecords.length > 0 
      ? profitRecords.reduce((sum, rec) => sum + (rec.profit_margin_percent || 0), 0) / profitRecords.length
      : 0;

    const totalLaborHours = jobs.reduce((sum, j) => sum + (j.total_time_spent || 0), 0);
    const avgUtilization = technicians.length > 0 ? (totalLaborHours / technicians.length) : 0;

    return {
      completionRate,
      onTimeRate,
      totalRevenue,
      totalProfit,
      avgProfitMargin,
      totalLaborHours,
      avgUtilization,
      activeAlerts: alerts.length
    };
  }, [jobs, invoices, profitRecords, technicians, alerts]);

  // Technician performance
  const techPerformance = useMemo(() => {
    return technicians.map(tech => {
      const techJobs = jobs.filter(j => 
        j.technicians?.some(t => t.id === tech.id)
      );
      const completed = techJobs.filter(j => j.status === 'completed').length;
      const hours = techJobs.reduce((sum, j) => {
        const techData = j.technicians.find(t => t.id === tech.id);
        return sum + (techData?.time_spent || 0);
      }, 0);

      return {
        name: `${tech.first_name} ${tech.last_name}`,
        jobs: techJobs.length,
        completed,
        hours: hours.toFixed(1),
        efficiency: techJobs.length > 0 ? (completed / techJobs.length * 100).toFixed(0) : 0
      };
    }).sort((a, b) => b.completed - a.completed);
  }, [technicians, jobs]);

  // Revenue trend
  const revenueTrend = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayInvoices = invoices.filter(inv => 
        inv.invoice_date && inv.invoice_date.startsWith(dayStr)
      );
      const revenue = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      return {
        date: format(day, 'MMM d'),
        revenue: revenue
      };
    });
  }, [invoices]);

  // Job status distribution
  const statusDistribution = useMemo(() => {
    const statuses = {
      'new': 0,
      'scheduled': 0,
      'in_progress': 0,
      'review': 0,
      'completed': 0
    };

    jobs.forEach(job => {
      if (statuses.hasOwnProperty(job.status)) {
        statuses[job.status]++;
      }
    });

    return Object.entries(statuses).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count
    }));
  }, [jobs]);

  const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manager Dashboard</h1>
        <p className="text-slate-500 mt-1">Performance overview and team analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold mt-2">{kpis.completionRate.toFixed(0)}%</p>
              </div>
              <Target className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">On-Time Rate</p>
                <p className="text-3xl font-bold mt-2">{kpis.onTimeRate.toFixed(0)}%</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">${kpis.totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Profit Margin</p>
                <p className="text-3xl font-bold mt-2">{kpis.avgProfitMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueTrend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Technician Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techPerformance}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#10b981" name="Completed Jobs" />
                <Bar dataKey="hours" fill="#3b82f6" name="Hours Worked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <Card className="lg:col-span-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Active Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 10).map(alert => (
                <div key={alert.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs text-slate-600">{alert.message}</p>
                  </div>
                  <Badge className={
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Profitability Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profitability Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-green-700">${kpis.totalProfit.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Avg Margin</p>
                <p className="text-2xl font-bold text-blue-700">{kpis.avgProfitMargin.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Labor Hours</p>
                <p className="text-2xl font-bold text-purple-700">{kpis.totalLaborHours.toFixed(0)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
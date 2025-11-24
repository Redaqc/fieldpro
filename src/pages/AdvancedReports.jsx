import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Filter, TrendingUp, DollarSign, Clock, Users } from "lucide-react";
import { JOB_STATUS, INVOICE_STATUS } from "@/constants/statuses";

export default function AdvancedReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('revenue');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const filteredData = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    const filteredJobs = jobs.filter(j => {
      const date = new Date(j.created_date);
      return date >= start && date <= end;
    });

    const filteredInvoices = invoices.filter(i => {
      const date = new Date(i.invoice_date || i.created_date);
      return date >= start && date <= end;
    });

    return { jobs: filteredJobs, invoices: filteredInvoices };
  }, [jobs, invoices, dateRange]);

  const revenueData = useMemo(() => {
    const byMonth = {};
    filteredData.invoices.forEach(inv => {
      if (inv.status === INVOICE_STATUS.PAID) {
        const month = new Date(inv.paid_date || inv.invoice_date).toLocaleString('default', { month: 'short' });
        byMonth[month] = (byMonth[month] || 0) + (inv.total || 0);
      }
    });
    return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }));
  }, [filteredData]);

  const techPerformance = useMemo(() => {
    return technicians.map(tech => {
      const techJobs = filteredData.jobs.filter(j =>
        j.technicians?.some(t => t.id === tech.id)
      );
      const completed = techJobs.filter(j => j.status === JOB_STATUS.COMPLETED).length;
      const hours = techJobs.reduce((sum, j) => sum + (j.total_time_spent || 0), 0);
      
      return {
        name: `${tech.first_name} ${tech.last_name}`,
        jobs: techJobs.length,
        completed,
        hours: Math.round(hours)
      };
    });
  }, [technicians, filteredData]);

  const statusDistribution = useMemo(() => {
    const dist = filteredData.jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    const colors = {
      [JOB_STATUS.TODO]: '#94a3b8',
      [JOB_STATUS.IN_PROGRESS]: '#3b82f6',
      [JOB_STATUS.COMPLETED]: '#10b981',
      [JOB_STATUS.REVIEW]: '#8b5cf6'
    };

    return Object.entries(dist).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: colors[status] || '#64748b'
    }));
  }, [filteredData]);

  const kpis = useMemo(() => {
    const totalRevenue = filteredData.invoices
      .filter(i => i.status === INVOICE_STATUS.PAID)
      .reduce((sum, i) => sum + (i.total || 0), 0);

    const avgJobTime = filteredData.jobs.length > 0
      ? filteredData.jobs.reduce((sum, j) => sum + (j.total_time_spent || 0), 0) / filteredData.jobs.length
      : 0;

    const completionRate = filteredData.jobs.length > 0
      ? (filteredData.jobs.filter(j => j.status === JOB_STATUS.COMPLETED).length / filteredData.jobs.length * 100)
      : 0;

    return {
      totalRevenue,
      totalJobs: filteredData.jobs.length,
      avgJobTime: avgJobTime.toFixed(1),
      completionRate: completionRate.toFixed(1)
    };
  }, [filteredData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-slate-500 mt-1">Deep insights into your business performance</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="status">Job Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">${kpis.totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Jobs</p>
                <p className="text-3xl font-bold mt-1">{kpis.totalJobs}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Job Time</p>
                <p className="text-3xl font-bold mt-1">{kpis.avgJobTime}h</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold mt-1">{kpis.completionRate}%</p>
              </div>
              <Users className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Technician Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#3b82f6" />
                <Bar dataKey="hours" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
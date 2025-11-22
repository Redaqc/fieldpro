import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Download, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";

export default function BIDashboard() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [metric, setMetric] = useState('revenue');

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

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const filteredData = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    return {
      jobs: jobs.filter(j => new Date(j.created_date) >= start && new Date(j.created_date) <= end),
      invoices: invoices.filter(i => new Date(i.invoice_date || i.created_date) >= start && new Date(i.invoice_date || i.created_date) <= end)
    };
  }, [jobs, invoices, dateRange]);

  // Revenue over time
  const revenueTimeline = useMemo(() => {
    const days = eachDayOfInterval({ 
      start: new Date(dateRange.start), 
      end: new Date(dateRange.end) 
    });

    return days.map(day => {
      const dayStr = format(day, 'MMM dd');
      const dayRevenue = filteredData.invoices
        .filter(i => i.status === 'paid' && format(new Date(i.paid_date || i.invoice_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((sum, i) => sum + (i.total || 0), 0);
      
      return { date: dayStr, revenue: dayRevenue };
    });
  }, [filteredData, dateRange]);

  // Jobs by status
  const jobsByStatus = useMemo(() => {
    const statuses = ['todo', 'in_progress', 'review', 'completed'];
    const colors = { todo: '#94a3b8', in_progress: '#3b82f6', review: '#8b5cf6', completed: '#10b981' };
    
    return statuses.map(status => ({
      name: status.replace('_', ' '),
      value: filteredData.jobs.filter(j => j.status === status).length,
      color: colors[status]
    }));
  }, [filteredData]);

  // Technician performance
  const techPerformance = useMemo(() => {
    return technicians.slice(0, 10).map(tech => {
      const techJobs = filteredData.jobs.filter(j => j.technicians?.some(t => t.id === tech.id));
      const completed = techJobs.filter(j => j.status === 'completed').length;
      const revenue = filteredData.invoices
        .filter(inv => {
          const job = jobs.find(j => j.id === inv.job_id);
          return job?.technicians?.some(t => t.id === tech.id) && inv.status === 'paid';
        })
        .reduce((sum, i) => sum + (i.total || 0), 0);

      return {
        name: `${tech.first_name} ${tech.last_name}`,
        jobs: techJobs.length,
        completed,
        revenue: Math.round(revenue)
      };
    });
  }, [technicians, filteredData, jobs]);

  // Customer lifetime value
  const topCustomers = useMemo(() => {
    return customers.map(customer => {
      const customerInvoices = filteredData.invoices.filter(i => i.customer_id === customer.id && i.status === 'paid');
      const ltv = customerInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      
      return {
        name: `${customer.first_name} ${customer.last_name}`,
        ltv,
        jobs: filteredData.jobs.filter(j => j.customer_id === customer.id).length
      };
    }).sort((a, b) => b.ltv - a.ltv).slice(0, 10);
  }, [customers, filteredData]);

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredData.invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total || 0), 0);
    
    const avgJobValue = filteredData.jobs.length > 0 
      ? totalRevenue / filteredData.jobs.length 
      : 0;

    const completionRate = filteredData.jobs.length > 0
      ? (filteredData.jobs.filter(j => j.status === 'completed').length / filteredData.jobs.length * 100)
      : 0;

    return {
      totalRevenue: totalRevenue.toFixed(0),
      totalJobs: filteredData.jobs.length,
      avgJobValue: avgJobValue.toFixed(0),
      completionRate: completionRate.toFixed(1)
    };
  }, [filteredData]);

  const exportReport = () => {
    const data = {
      period: `${dateRange.start} to ${dateRange.end}`,
      kpis,
      revenueTimeline,
      techPerformance,
      topCustomers
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Business Intelligence</h1>
          <p className="text-slate-500 mt-1">Advanced analytics and insights</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium mb-1 block">Primary Metric</label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">${kpis.totalRevenue}</p>
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
              <Briefcase className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Job Value</p>
                <p className="text-3xl font-bold mt-1">${kpis.avgJobValue}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600" />
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
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="performance">Technician Performance</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="status">Job Status</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Technicians by Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={techPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed Jobs" />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Customers by Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ltv" fill="#8b5cf6" name="Lifetime Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={jobsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {jobsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
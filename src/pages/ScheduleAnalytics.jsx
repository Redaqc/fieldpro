import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format, differenceInHours, isAfter } from "date-fns";
import { JOB_STATUS, SERVICE_CALL_STATUS } from "@/constants/statuses";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function ScheduleAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

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

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  // Combine all events
  const allEvents = useMemo(() => {
    const jobEvents = jobs.map(j => ({ ...j, type: 'job' }));
    const callEvents = serviceCalls.map(c => ({ ...c, type: 'service_call' }));
    return [...jobEvents, ...callEvents];
  }, [jobs, serviceCalls]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const eventDate = event.start_date ? new Date(event.start_date) : null;
      if (!eventDate) return false;

      const inRange = eventDate >= new Date(dateRange.start) && eventDate <= new Date(dateRange.end);
      if (!inRange) return false;

      if (selectedTechnician !== 'all' && !event.technicians?.some(t => t.id === selectedTechnician)) {
        return false;
      }

      if (selectedType !== 'all' && event.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [allEvents, dateRange, selectedTechnician, selectedType]);

  // 1. Technician Workload Distribution
  const workloadData = useMemo(() => {
    const workload = {};
    technicians.forEach(tech => {
      workload[tech.id] = {
        name: `${tech.first_name} ${tech.last_name}`,
        jobs: 0,
        serviceCalls: 0,
        totalHours: 0
      };
    });

    filteredEvents.forEach(event => {
      event.technicians?.forEach(tech => {
        if (workload[tech.id]) {
          if (event.type === 'job') {
            workload[tech.id].jobs++;
          } else {
            workload[tech.id].serviceCalls++;
          }
          workload[tech.id].totalHours += event.total_time_spent || 0;
        }
      });
    });

    return Object.values(workload).filter(w => w.jobs > 0 || w.serviceCalls > 0);
  }, [filteredEvents, technicians]);

  // 2. Average Completion Time
  const completionTimeData = useMemo(() => {
    const byType = { job: [], service_call: [] };

    filteredEvents.forEach(event => {
      const isCompleted = (event.type === 'job' && event.status === JOB_STATUS.COMPLETED) ||
                          (event.type === 'service_call' && event.status === SERVICE_CALL_STATUS.COMPLETED);
      if (isCompleted && event.start_date && event.completed_at) {
        const hours = differenceInHours(new Date(event.completed_at), new Date(event.start_date));
        if (hours > 0 && hours < 1000) { // Filter outliers
          byType[event.type].push(hours);
        }
      }
    });

    return [
      { name: 'Jobs', avgHours: byType.job.length > 0 ? (byType.job.reduce((a, b) => a + b, 0) / byType.job.length).toFixed(1) : 0 },
      { name: 'Service Calls', avgHours: byType.service_call.length > 0 ? (byType.service_call.reduce((a, b) => a + b, 0) / byType.service_call.length).toFixed(1) : 0 }
    ];
  }, [filteredEvents]);

  // 3. On-Time Completion Rate
  const onTimeRate = useMemo(() => {
    const completed = filteredEvents.filter(e =>
      (e.type === 'job' && e.status === JOB_STATUS.COMPLETED) ||
      (e.type === 'service_call' && e.status === SERVICE_CALL_STATUS.COMPLETED)
    );
    const onTime = completed.filter(e => {
      if (!e.due_date || !e.completed_at) return false;
      return new Date(e.completed_at) <= new Date(e.due_date);
    });

    const rate = completed.length > 0 ? ((onTime.length / completed.length) * 100).toFixed(1) : 0;

    return [
      { name: 'On Time', value: onTime.length },
      { name: 'Late', value: completed.length - onTime.length }
    ];
  }, [filteredEvents]);

  // 4. Overdue Events
  const overdueData = useMemo(() => {
    const now = new Date();
    const overdue = filteredEvents.filter(event => {
      const isNotCompleted = (event.type === 'job' && event.status !== JOB_STATUS.COMPLETED) ||
                             (event.type === 'service_call' && event.status !== SERVICE_CALL_STATUS.COMPLETED);
      return isNotCompleted && event.due_date && isAfter(now, new Date(event.due_date));
    });

    return {
      jobs: overdue.filter(e => e.type === 'job').length,
      serviceCalls: overdue.filter(e => e.type === 'service_call').length,
      total: overdue.length
    };
  }, [filteredEvents]);

  // 5. Status Distribution
  const statusData = useMemo(() => {
    const statuses = { [JOB_STATUS.TODO]: 0, [JOB_STATUS.IN_PROGRESS]: 0, [JOB_STATUS.REVIEW]: 0, [JOB_STATUS.COMPLETED]: 0 };
    filteredEvents.forEach(event => {
      if (statuses[event.status] !== undefined) {
        statuses[event.status]++;
      }
    });

    return Object.entries(statuses).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  }, [filteredEvents]);

  // Summary Stats
  const stats = useMemo(() => {
    const completed = filteredEvents.filter(e =>
      (e.type === 'job' && e.status === JOB_STATUS.COMPLETED) ||
      (e.type === 'service_call' && e.status === SERVICE_CALL_STATUS.COMPLETED)
    ).length;
    const inProgress = filteredEvents.filter(e =>
      (e.type === 'job' && e.status === JOB_STATUS.IN_PROGRESS) ||
      (e.type === 'service_call' && e.status === SERVICE_CALL_STATUS.IN_PROGRESS)
    ).length;
    const totalHours = filteredEvents.reduce((sum, e) => sum + (e.total_time_spent || 0), 0);

    return { completed, inProgress, totalHours, total: filteredEvents.length };
  }, [filteredEvents]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Schedule Analytics</h1>
        <p className="text-slate-500 mt-1">Insights into scheduling efficiency and performance</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <Label>Technician</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="job">Jobs Only</SelectItem>
                  <SelectItem value="service_call">Service Calls Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Events</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueData.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Technician Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="jobs" fill="#3b82f6" name="Jobs" />
                <Bar dataKey="serviceCalls" fill="#10b981" name="Service Calls" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Completion Time */}
        <Card>
          <CardHeader>
            <CardTitle>Average Completion Time (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgHours" fill="#8b5cf6" name="Avg Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Time Rate */}
        <Card>
          <CardHeader>
            <CardTitle>On-Time Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={onTimeRate}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {onTimeRate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Total Hours by Technician */}
      <Card>
        <CardHeader>
          <CardTitle>Total Hours Worked by Technician</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalHours" fill="#f59e0b" name="Total Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
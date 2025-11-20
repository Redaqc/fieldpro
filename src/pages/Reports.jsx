import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Clock, DollarSign, Users, FileText, MapPin, AlertTriangle, Download, BarChart2, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, endOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const REPORTS = [
  { id: 'time_tracking', name: 'Rapports de Temps', description: 'Analyse du temps passé par technicien et projet', icon: Clock, color: 'bg-blue-500', isTab: true },
  { id: 'profitability', name: 'Rentabilité', description: 'Analyse de rentabilité des projets', icon: TrendingUp, color: 'bg-green-500', page: 'ProfitabilityReports' },
  { id: 'costs', name: 'Gestion des Coûts', description: 'Suivi des dépenses et factures fournisseurs', icon: DollarSign, color: 'bg-orange-500', page: 'CostsManagement' },
  { id: 'team_performance', name: 'Performance Équipe', description: 'Statistiques de performance des techniciens', icon: Users, color: 'bg-purple-500', page: 'Team' },
  { id: 'invoices', name: 'Facturation', description: 'Rapports de facturation et paiements', icon: FileText, color: 'bg-indigo-500', page: 'Invoices' },
  { id: 'gps_tracking', name: 'Suivi GPS', description: 'Rapports de localisation et déplacements', icon: MapPin, color: 'bg-teal-500', page: 'GPSTracking' },
  { id: 'safety_forms', name: 'Formulaires Sécurité', description: 'Rapports des inspections et incidents', icon: AlertTriangle, color: 'bg-red-500', page: 'Forms' },
  { id: 'documents', name: 'Documents', description: 'Vue d\'ensemble des documents', icon: FileText, color: 'bg-cyan-500', page: 'Documents' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('hub');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedJob, setSelectedJob] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [groupBy, setGroupBy] = useState('technician');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: serviceCalls = [] } = useQuery({
    queryKey: ['serviceCalls'],
    queryFn: () => base44.entities.ServiceCall.list(),
    initialData: [],
  });

  const { data: workTypes = [] } = useQuery({
    queryKey: ['workTypes'],
    queryFn: () => base44.entities.WorkType.list(),
    initialData: [],
  });

  const allTimeLogs = jobs.flatMap(job => 
    (job.technicians || []).flatMap(tech => 
      (tech.time_logs || []).map(log => ({
        ...log,
        technician_id: tech.id,
        technician_name: tech.name,
        job_id: job.id,
        job_title: job.title,
      }))
    )
  );

  const filteredLogs = allTimeLogs.filter(log => {
    const logDate = new Date(log.start);
    const matchesDate = (!dateRange.start || logDate >= new Date(dateRange.start)) &&
                       (!dateRange.end || logDate <= endOfDay(new Date(dateRange.end)));
    const matchesTech = selectedTech === 'all' || log.technician_id === selectedTech;
    const matchesJob = selectedJob === 'all' || log.job_id === selectedJob;
    return matchesDate && matchesTech && matchesJob;
  });

  const aggregatedByTech = technicians.map(tech => {
    const techLogs = filteredLogs.filter(log => log.technician_id === tech.id);
    const totalHours = techLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return { name: `${tech.first_name} ${tech.last_name}`, hours: parseFloat(totalHours.toFixed(2)), count: techLogs.length };
  }).filter(item => item.hours > 0);

  const aggregatedByJob = jobs.map(job => {
    const jobLogs = filteredLogs.filter(log => log.job_id === job.id);
    const totalHours = jobLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return { name: job.title, hours: parseFloat(totalHours.toFixed(2)), count: jobLogs.length };
  }).filter(item => item.hours > 0).slice(0, 10);

  const aggregatedByDay = filteredLogs.reduce((acc, log) => {
    const day = format(new Date(log.start), 'dd/MM');
    if (!acc[day]) acc[day] = 0;
    acc[day] += log.duration || 0;
    return acc;
  }, {});

  const dailyData = Object.entries(aggregatedByDay).map(([day, hours]) => ({
    day, hours: parseFloat(hours.toFixed(2))
  })).slice(-14);

  const totalHours = filteredLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const avgHoursPerDay = dailyData.length > 0 ? totalHours / dailyData.length : 0;

  // Jobs & Service Calls Filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const jobDate = job.created_date ? new Date(job.created_date) : null;
      const matchesDate = (!dateRange.start || !jobDate || jobDate >= new Date(dateRange.start)) &&
                         (!dateRange.end || !jobDate || jobDate <= endOfDay(new Date(dateRange.end)));
      const matchesTech = selectedTech === 'all' || (job.technicians || []).some(t => t.id === selectedTech);
      const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
      const matchesWorkType = selectedWorkType === 'all' || job.work_type_id === selectedWorkType;
      return matchesDate && matchesTech && matchesStatus && matchesWorkType;
    });
  }, [jobs, dateRange, selectedTech, selectedStatus, selectedWorkType]);

  const filteredServiceCalls = useMemo(() => {
    return serviceCalls.filter(call => {
      const callDate = call.created_date ? new Date(call.created_date) : null;
      const matchesDate = (!dateRange.start || !callDate || callDate >= new Date(dateRange.start)) &&
                         (!dateRange.end || !callDate || callDate <= endOfDay(new Date(dateRange.end)));
      const matchesTech = selectedTech === 'all' || (call.technicians || []).some(t => t.id === selectedTech);
      const matchesStatus = selectedStatus === 'all' || call.status === selectedStatus;
      const matchesWorkType = selectedWorkType === 'all' || call.work_type_id === selectedWorkType;
      return matchesDate && matchesTech && matchesStatus && matchesWorkType;
    });
  }, [serviceCalls, dateRange, selectedTech, selectedStatus, selectedWorkType]);

  // Jobs by Status
  const jobsByStatus = useMemo(() => {
    const statusCounts = { todo: 0, in_progress: 0, review: 0, completed: 0, archived: 0 };
    filteredJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'todo' ? 'À faire' : status === 'in_progress' ? 'En cours' : 
            status === 'review' ? 'Révision' : status === 'completed' ? 'Terminé' : 'Archivé',
      value: count
    }));
  }, [filteredJobs]);

  // Service Calls by Status
  const callsByStatus = useMemo(() => {
    const statusCounts = { todo: 0, in_progress: 0, review: 0, completed: 0, archived: 0 };
    filteredServiceCalls.forEach(call => {
      statusCounts[call.status] = (statusCounts[call.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'todo' ? 'À faire' : status === 'in_progress' ? 'En cours' : 
            status === 'review' ? 'Révision' : status === 'completed' ? 'Terminé' : 'Archivé',
      value: count
    }));
  }, [filteredServiceCalls]);

  // Profitability Data
  const profitabilityData = useMemo(() => {
    return filteredJobs.map(job => {
      const revenue = job.invoice_total || 0;
      const costs = job.costs?.total_cost || 0;
      const profit = revenue - costs;
      const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;
      
      return {
        id: job.id,
        title: job.title,
        revenue,
        costs,
        profit,
        margin: parseFloat(margin.toFixed(1)),
        status: job.status
      };
    }).filter(item => item.revenue > 0 || item.costs > 0);
  }, [filteredJobs]);

  const totalRevenue = profitabilityData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCosts = profitabilityData.reduce((sum, item) => sum + item.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

  const exportToCSV = () => {
    const headers = ['Date', 'Technicien', 'Job', 'Début', 'Fin', 'Durée (h)'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.start), 'yyyy-MM-dd'),
      log.technician_name,
      log.job_title,
      format(new Date(log.start), 'HH:mm'),
      format(new Date(log.end), 'HH:mm'),
      log.duration
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-temps-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const setQuickRange = (type) => {
    const end = new Date();
    let start = new Date();
    
    if (type === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (type === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (type === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0);
    }
    
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Rapports</h1>
        <p className="text-slate-500 mt-1">Rapports analytiques et suivi du temps</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="hub" className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Hub
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="servicecalls" className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4" />
            Appels
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Temps
          </TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Rentabilité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REPORTS.map(report => {
              const Icon = report.icon;
              const handleClick = () => {
                if (report.isTab) {
                  setActiveTab('time');
                }
              };
              
              return report.isTab ? (
                <Card key={report.id} onClick={handleClick} className="hover:shadow-xl transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">{report.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{report.description}</p>
                  </CardContent>
                </Card>
              ) : (
                <Link key={report.id} to={createPageUrl(report.page)}>
                  <Card className="hover:shadow-xl transition-all duration-200 cursor-pointer group h-full">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">{report.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{report.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Export de Données</h3>
              <p className="text-blue-700 mb-4">
                Tous les rapports peuvent être exportés au format CSV pour une analyse approfondie dans Excel ou d'autres outils.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Temps</p>
                  <p className="text-sm text-blue-600">Filtrez par date, technicien, job</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Factures</p>
                  <p className="text-sm text-blue-600">Export par client, payé/non payé</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Visualisations</p>
                  <p className="text-sm text-blue-600">Graphiques interactifs</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Export CSV</p>
                  <p className="text-sm text-blue-600">Téléchargement instantané</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Filtres Jobs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date début</label>
                  <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date fin</label>
                  <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedTech} onValueChange={setSelectedTech}>
                  <SelectTrigger><SelectValue placeholder="Technicien" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les techniciens</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="review">Révision</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {workTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label_fr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  const csv = [
                    ['Titre', 'Statut', 'Priorité', 'Type', 'Techniciens', 'Date création'],
                    ...filteredJobs.map(job => [
                      job.title,
                      job.status,
                      job.priority,
                      job.work_type_name || '',
                      (job.technicians || []).map(t => t.name).join(', '),
                      job.created_date ? format(new Date(job.created_date), 'yyyy-MM-dd') : ''
                    ])
                  ].map(row => row.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `jobs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  a.click();
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Total Jobs</p>
                <p className="text-2xl font-bold">{filteredJobs.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredJobs.filter(j => j.status === 'in_progress').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Terminés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredJobs.filter(j => j.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Temps total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredJobs.reduce((sum, j) => sum + (j.total_time_spent || 0), 0).toFixed(1)}h
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Répartition par statut</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={jobsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {jobsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Liste des jobs</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Titre</th>
                      <th className="text-left p-3 text-sm font-medium">Statut</th>
                      <th className="text-left p-3 text-sm font-medium">Type</th>
                      <th className="text-left p-3 text-sm font-medium">Techniciens</th>
                      <th className="text-right p-3 text-sm font-medium">Temps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.slice(0, 50).map(job => (
                      <tr key={job.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 text-sm">{job.title}</td>
                        <td className="p-3 text-sm">
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{job.work_type_name || '-'}</td>
                        <td className="p-3 text-sm">{(job.technicians || []).map(t => t.name).join(', ') || '-'}</td>
                        <td className="p-3 text-sm text-right font-medium">{(job.total_time_spent || 0).toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicecalls" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Filtres Appels de Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date début</label>
                  <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date fin</label>
                  <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedTech} onValueChange={setSelectedTech}>
                  <SelectTrigger><SelectValue placeholder="Technicien" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les techniciens</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="review">Révision</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {workTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label_fr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  const csv = [
                    ['Titre', 'Statut', 'Priorité', 'Type', 'Techniciens', 'Date création'],
                    ...filteredServiceCalls.map(call => [
                      call.title,
                      call.status,
                      call.priority,
                      call.work_type_name || '',
                      (call.technicians || []).map(t => t.name).join(', '),
                      call.created_date ? format(new Date(call.created_date), 'yyyy-MM-dd') : ''
                    ])
                  ].map(row => row.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `appels-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  a.click();
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Total Appels</p>
                <p className="text-2xl font-bold">{filteredServiceCalls.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredServiceCalls.filter(c => c.status === 'in_progress').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Terminés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredServiceCalls.filter(c => c.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Temps total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredServiceCalls.reduce((sum, c) => sum + (c.total_time_spent || 0), 0).toFixed(1)}h
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Répartition par statut</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={callsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {callsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Liste des appels</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Titre</th>
                      <th className="text-left p-3 text-sm font-medium">Statut</th>
                      <th className="text-left p-3 text-sm font-medium">Type</th>
                      <th className="text-left p-3 text-sm font-medium">Techniciens</th>
                      <th className="text-right p-3 text-sm font-medium">Temps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServiceCalls.slice(0, 50).map(call => (
                      <tr key={call.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 text-sm">{call.title}</td>
                        <td className="p-3 text-sm">
                          <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                            {call.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{call.work_type_name || '-'}</td>
                        <td className="p-3 text-sm">{(call.technicians || []).map(t => t.name).join(', ') || '-'}</td>
                        <td className="p-3 text-sm text-right font-medium">{(call.total_time_spent || 0).toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Filtres Rentabilité</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date début</label>
                  <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date fin</label>
                  <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="completed">Terminés seulement</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {workTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label_fr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  const csv = [
                    ['Job', 'Revenus', 'Coûts', 'Profit', 'Marge %', 'Statut'],
                    ...profitabilityData.map(item => [
                      item.title,
                      item.revenue.toFixed(2),
                      item.costs.toFixed(2),
                      item.profit.toFixed(2),
                      item.margin.toFixed(2),
                      item.status
                    ])
                  ].map(row => row.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `rentabilite-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  a.click();
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Revenus totaux</p>
                <p className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)} $</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Coûts totaux</p>
                <p className="text-2xl font-bold text-red-600">{totalCosts.toFixed(2)} $</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Profit total</p>
                <p className="text-2xl font-bold text-blue-600">{totalProfit.toFixed(2)} $</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Marge moyenne</p>
                <p className="text-2xl font-bold text-purple-600">{avgMargin.toFixed(1)} %</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top 10 projets rentables</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitabilityData.sort((a, b) => b.profit - a.profit).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenus" />
                  <Bar dataKey="costs" fill="#ef4444" name="Coûts" />
                  <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Détails rentabilité</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Job</th>
                      <th className="text-right p-3 text-sm font-medium">Revenus</th>
                      <th className="text-right p-3 text-sm font-medium">Coûts</th>
                      <th className="text-right p-3 text-sm font-medium">Profit</th>
                      <th className="text-right p-3 text-sm font-medium">Marge %</th>
                      <th className="text-left p-3 text-sm font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.slice(0, 50).map(item => (
                      <tr key={item.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-sm text-right text-green-600">{item.revenue.toFixed(2)} $</td>
                        <td className="p-3 text-sm text-right text-red-600">{item.costs.toFixed(2)} $</td>
                        <td className="p-3 text-sm text-right font-medium text-blue-600">{item.profit.toFixed(2)} $</td>
                        <td className="p-3 text-sm text-right font-bold">
                          <span className={item.margin > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.margin.toFixed(1)} %
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Total Heures</p>
                <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(2)}h</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-green-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Moyenne/Jour</p>
                <p className="text-2xl font-bold text-slate-900">{avgHoursPerDay.toFixed(2)}h</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-purple-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Entrées</p>
                <p className="text-2xl font-bold text-slate-900">{filteredLogs.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtres</h3>
                <Button size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date début</label>
                  <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date fin</label>
                  <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuickRange('week')}>7 jours</Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange('month')}>30 jours</Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange('lastMonth')}>Mois dernier</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedTech} onValueChange={setSelectedTech}>
                  <SelectTrigger><SelectValue placeholder="Technicien" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les techniciens</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger><SelectValue placeholder="Job" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les jobs</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger><SelectValue placeholder="Grouper par" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Par technicien</SelectItem>
                    <SelectItem value="job">Par job</SelectItem>
                    <SelectItem value="day">Par jour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {groupBy === 'technician' && aggregatedByTech.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Heures par technicien</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aggregatedByTech}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#3b82f6" name="Heures" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {groupBy === 'job' && aggregatedByJob.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top 10 jobs par heures</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aggregatedByJob} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#10b981" name="Heures" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {groupBy === 'day' && dailyData.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Évolution quotidienne</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="hours" stroke="#8b5cf6" name="Heures" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Détail des entrées de temps</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Date</th>
                      <th className="text-left p-3 text-sm font-medium">Technicien</th>
                      <th className="text-left p-3 text-sm font-medium">Job</th>
                      <th className="text-left p-3 text-sm font-medium">Début</th>
                      <th className="text-left p-3 text-sm font-medium">Fin</th>
                      <th className="text-right p-3 text-sm font-medium">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.slice(0, 50).map((log, idx) => (
                      <tr key={idx} className="border-t hover:bg-slate-50">
                        <td className="p-3 text-sm">{format(new Date(log.start), 'dd/MM/yyyy')}</td>
                        <td className="p-3 text-sm">{log.technician_name}</td>
                        <td className="p-3 text-sm">{log.job_title}</td>
                        <td className="p-3 text-sm">{format(new Date(log.start), 'HH:mm')}</td>
                        <td className="p-3 text-sm">{format(new Date(log.end), 'HH:mm')}</td>
                        <td className="p-3 text-sm text-right font-medium">{log.duration?.toFixed(2)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
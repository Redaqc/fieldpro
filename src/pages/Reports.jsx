import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Clock, DollarSign, Users, FileText, MapPin, AlertTriangle, Download, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

const REPORTS = [
  { id: 'profitability', name: 'Rentabilité', description: 'Analyse de rentabilité des projets', icon: TrendingUp, color: 'bg-green-500', page: 'ProfitabilityReports' },
  { id: 'costs', name: 'Gestion des Coûts', description: 'Suivi des dépenses et factures fournisseurs', icon: DollarSign, color: 'bg-orange-500', page: 'CostsManagement' },
  { id: 'team_performance', name: 'Performance Équipe', description: 'Statistiques de performance des techniciens', icon: Users, color: 'bg-purple-500', page: 'Team' },
  { id: 'invoices', name: 'Facturation', description: 'Rapports de facturation et paiements', icon: FileText, color: 'bg-indigo-500', page: 'Invoices' },
  { id: 'gps_tracking', name: 'Suivi GPS', description: 'Rapports de localisation et déplacements', icon: MapPin, color: 'bg-teal-500', page: 'GPSTracking' },
  { id: 'safety_forms', name: 'Formulaires Sécurité', description: 'Rapports des inspections et incidents', icon: AlertTriangle, color: 'bg-red-500', page: 'Forms' },
  { id: 'documents', name: 'Documents', description: 'Vue d\'ensemble des documents', icon: FileText, color: 'bg-cyan-500', page: 'Documents' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('hub');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedJob, setSelectedJob] = useState('all');
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
        <TabsList>
          <TabsTrigger value="hub" className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Hub de rapports
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Rapports de temps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REPORTS.map(report => {
              const Icon = report.icon;
              return (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Filtres Avancés</p>
                  <p className="text-sm text-blue-600">Filtrez par date, statut, technicien, etc.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Visualisations</p>
                  <p className="text-sm text-blue-600">Graphiques interactifs pour mieux comprendre</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Export CSV</p>
                  <p className="text-sm text-blue-600">Téléchargez vos données facilement</p>
                </div>
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
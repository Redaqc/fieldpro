import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

export default function TimeReports() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [groupBy, setGroupBy] = useState('technician'); // technician, job, day

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

  // Filtrer et agréger les données de temps
  const timeData = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    let filteredJobs = jobs.filter(job => {
      if (selectedJobId !== 'all' && job.id !== selectedJobId) return false;
      return job.technicians && job.technicians.length > 0;
    });

    const records = [];
    
    filteredJobs.forEach(job => {
      (job.technicians || []).forEach(tech => {
        if (selectedTechnicianId !== 'all' && tech.id !== selectedTechnicianId) return;
        
        const techDetails = technicians.find(t => t.id === tech.id);
        if (!techDetails) return;

        (tech.time_logs || []).forEach(log => {
          const logStart = parseISO(log.start);
          if (isWithinInterval(logStart, { start, end })) {
            records.push({
              technicianId: tech.id,
              technicianName: `${techDetails.first_name} ${techDetails.last_name}`,
              jobId: job.id,
              jobTitle: job.title,
              date: format(logStart, 'yyyy-MM-dd'),
              dateLabel: format(logStart, 'dd MMM', { locale: fr }),
              duration: log.duration,
              start: log.start,
              end: log.end,
            });
          }
        });
      });
    });

    return records;
  }, [jobs, technicians, dateRange, selectedJobId, selectedTechnicianId]);

  // Agréger par technicien
  const byTechnician = useMemo(() => {
    const grouped = {};
    timeData.forEach(record => {
      if (!grouped[record.technicianId]) {
        grouped[record.technicianId] = {
          name: record.technicianName,
          totalHours: 0,
          jobCount: new Set(),
        };
      }
      grouped[record.technicianId].totalHours += record.duration;
      grouped[record.technicianId].jobCount.add(record.jobId);
    });
    
    return Object.values(grouped).map(g => ({
      name: g.name,
      hours: parseFloat(g.totalHours.toFixed(2)),
      jobs: g.jobCount.size,
    })).sort((a, b) => b.hours - a.hours);
  }, [timeData]);

  // Agréger par job
  const byJob = useMemo(() => {
    const grouped = {};
    timeData.forEach(record => {
      if (!grouped[record.jobId]) {
        grouped[record.jobId] = {
          name: record.jobTitle,
          totalHours: 0,
          techCount: new Set(),
        };
      }
      grouped[record.jobId].totalHours += record.duration;
      grouped[record.jobId].techCount.add(record.technicianId);
    });
    
    return Object.values(grouped).map(g => ({
      name: g.name.length > 30 ? g.name.substring(0, 30) + '...' : g.name,
      hours: parseFloat(g.totalHours.toFixed(2)),
      techs: g.techCount.size,
    })).sort((a, b) => b.hours - a.hours).slice(0, 10);
  }, [timeData]);

  // Agréger par jour
  const byDay = useMemo(() => {
    const grouped = {};
    timeData.forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = {
          date: record.date,
          label: record.dateLabel,
          totalHours: 0,
        };
      }
      grouped[record.date].totalHours += record.duration;
    });
    
    return Object.values(grouped).map(g => ({
      date: g.label,
      hours: parseFloat(g.totalHours.toFixed(2)),
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [timeData]);

  const totalHours = useMemo(() => {
    return timeData.reduce((sum, record) => sum + record.duration, 0);
  }, [timeData]);

  const avgHoursPerDay = useMemo(() => {
    if (byDay.length === 0) return 0;
    return totalHours / byDay.length;
  }, [totalHours, byDay]);

  const handleQuickRange = (range) => {
    const today = new Date();
    let start, end;
    
    switch(range) {
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        return;
    }
    
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Technicien', 'Job', 'Début', 'Fin', 'Durée (h)'];
    const rows = timeData.map(record => [
      record.date,
      record.technicianName,
      record.jobTitle,
      format(parseISO(record.start), 'HH:mm'),
      format(parseISO(record.end), 'HH:mm'),
      record.duration,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_temps_${dateRange.start}_${dateRange.end}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rapports de temps</h1>
          <p className="text-slate-500 mt-1">Analyses détaillées du temps passé</p>
        </div>
        <Button onClick={handleExportCSV} disabled={timeData.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Période rapide</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" onClick={() => handleQuickRange('week')}>
                  Semaine
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleQuickRange('month')}>
                  Mois
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleQuickRange('lastMonth')}>
                  Mois dernier
                </Button>
              </div>
            </div>

            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Technicien</Label>
              <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les techniciens</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les jobs</SelectItem>
                  {jobs.filter(j => j.technicians && j.technicians.length > 0).map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total heures</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(2)}h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Moyenne / jour</p>
                <p className="text-2xl font-bold">{avgHoursPerDay.toFixed(2)}h</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Jobs actifs</p>
                <p className="text-2xl font-bold">{byJob.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Techniciens</p>
                <p className="text-2xl font-bold">{byTechnician.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par technicien */}
        <Card>
          <CardHeader>
            <CardTitle>Heures par technicien</CardTitle>
          </CardHeader>
          <CardContent>
            {byTechnician.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byTechnician}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#3b82f6" name="Heures" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        {/* Par job */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 jobs par heures</CardTitle>
          </CardHeader>
          <CardContent>
            {byJob.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byJob} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#10b981" name="Heures" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        {/* Évolution temporelle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} name="Heures" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des entrées de temps ({timeData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Technicien</th>
                  <th className="text-left p-3">Job</th>
                  <th className="text-left p-3">Début</th>
                  <th className="text-left p-3">Fin</th>
                  <th className="text-right p-3">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {timeData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      Aucune entrée de temps pour cette période
                    </td>
                  </tr>
                ) : (
                  timeData.slice(0, 100).map((record, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">{format(parseISO(record.start), 'dd MMM yyyy', { locale: fr })}</td>
                      <td className="p-3 font-medium">{record.technicianName}</td>
                      <td className="p-3">{record.jobTitle}</td>
                      <td className="p-3">{format(parseISO(record.start), 'HH:mm')}</td>
                      <td className="p-3">{format(parseISO(record.end), 'HH:mm')}</td>
                      <td className="p-3 text-right font-semibold">{record.duration}h</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {timeData.length > 100 && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Affichage des 100 premières entrées sur {timeData.length}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
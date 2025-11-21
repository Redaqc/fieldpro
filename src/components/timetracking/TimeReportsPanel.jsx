import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, User, Briefcase, TrendingUp, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function TimeReportsPanel({ entries, technicians, jobs, startDate, endDate, lang = 'fr' }) {
  const [reportType, setReportType] = useState('technician');

  // Group by technician
  const technicianReport = useMemo(() => {
    return technicians.map(tech => {
      const techEntries = entries.filter(e => e.technician_id === tech.id);
      const totalHours = techEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      const totalDays = new Set(techEntries.map(e => format(new Date(e.clock_in), 'yyyy-MM-dd'))).size;
      
      return {
        technician_id: tech.id,
        name: `${tech.first_name} ${tech.last_name}`,
        entries: techEntries.length,
        total_hours: totalHours,
        days_worked: totalDays,
        avg_hours_per_day: totalDays > 0 ? totalHours / totalDays : 0,
        hourly_rate: tech.hourly_rate || 0,
        total_cost: (tech.hourly_rate || 0) * totalHours
      };
    }).filter(r => r.total_hours > 0);
  }, [entries, technicians]);

  // Group by project
  const projectReport = useMemo(() => {
    const jobMap = new Map();

    entries.forEach(entry => {
      if (!entry.job_id) return;
      
      if (!jobMap.has(entry.job_id)) {
        const job = jobs.find(j => j.id === entry.job_id);
        jobMap.set(entry.job_id, {
          job_id: entry.job_id,
          job_title: job?.title || 'Job sans nom',
          job_number: job?.job_number,
          entries: [],
          total_hours: 0,
          technicians: new Set()
        });
      }

      const jobData = jobMap.get(entry.job_id);
      jobData.entries.push(entry);
      jobData.total_hours += entry.total_hours || 0;
      jobData.technicians.add(entry.technician_name);
    });

    return Array.from(jobMap.values()).map(job => ({
      ...job,
      technicians: Array.from(job.technicians),
      entries_count: job.entries.length
    }));
  }, [entries, jobs]);

  // Chart data for technicians
  const techChartData = technicianReport.map(t => ({
    name: t.name.split(' ')[0],
    hours: parseFloat(t.total_hours.toFixed(1)),
    days: t.days_worked
  }));

  // Chart data for projects
  const projectChartData = projectReport.slice(0, 10).map(p => ({
    name: p.job_number || p.job_title.substring(0, 15),
    hours: parseFloat(p.total_hours.toFixed(1))
  }));

  const totalCost = technicianReport.reduce((sum, t) => sum + t.total_cost, 0);
  const totalHours = technicianReport.reduce((sum, t) => sum + t.total_hours, 0);

  const exportReport = () => {
    const data = reportType === 'technician' ? technicianReport : projectReport;
    
    let headers, rows;
    if (reportType === 'technician') {
      headers = ['Technicien', 'Entrées', 'Total Heures', 'Jours Travaillés', 'Moy. h/jour', 'Taux Horaire', 'Coût Total'];
      rows = data.map(t => [
        t.name,
        t.entries,
        t.total_hours.toFixed(2),
        t.days_worked,
        t.avg_hours_per_day.toFixed(2),
        `${t.hourly_rate}$`,
        `${t.total_cost.toFixed(2)}$`
      ]);
    } else {
      headers = ['Projet', 'Numéro', 'Entrées', 'Total Heures', 'Techniciens'];
      rows = data.map(p => [
        p.job_title,
        p.job_number || '-',
        p.entries_count,
        p.total_hours.toFixed(2),
        p.technicians.join(', ')
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_temps_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">
                  {lang === 'fr' ? 'Total Heures' : 'Total Hours'}
                </p>
                <p className="text-3xl font-bold text-blue-900">{totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium mb-1">
                  {lang === 'fr' ? 'Coût Total Main-d\'œuvre' : 'Total Labor Cost'}
                </p>
                <p className="text-3xl font-bold text-green-900">{totalCost.toFixed(0)}$</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium mb-1">
                  {lang === 'fr' ? 'Taux Horaire Moyen' : 'Avg Hourly Rate'}
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {totalHours > 0 ? (totalCost / totalHours).toFixed(0) : 0}$
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{lang === 'fr' ? 'Rapports Détaillés' : 'Detailed Reports'}</CardTitle>
            <Button onClick={exportReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Exporter' : 'Export'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="technician">
                <User className="w-4 h-4 mr-2" />
                {lang === 'fr' ? 'Par Technicien' : 'By Technician'}
              </TabsTrigger>
              <TabsTrigger value="project">
                <Briefcase className="w-4 h-4 mr-2" />
                {lang === 'fr' ? 'Par Projet' : 'By Project'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technician" className="space-y-6">
              {/* Bar Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-4">
                  {lang === 'fr' ? 'Heures par technicien' : 'Hours by Technician'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={techChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#3b82f6" name={lang === 'fr' ? 'Heures' : 'Hours'} />
                    <Bar dataKey="days" fill="#8b5cf6" name={lang === 'fr' ? 'Jours' : 'Days'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Technicien' : 'Technician'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Entrées' : 'Entries'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Heures' : 'Hours'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Jours' : 'Days'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Moy./Jour' : 'Avg/Day'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Taux' : 'Rate'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Coût' : 'Cost'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicianReport.map((tech, idx) => (
                      <tr key={tech.technician_id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            >
                              {tech.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium">{tech.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">{tech.entries}</td>
                        <td className="p-3 text-right font-semibold">{tech.total_hours.toFixed(1)}h</td>
                        <td className="p-3 text-right">{tech.days_worked}</td>
                        <td className="p-3 text-right">{tech.avg_hours_per_day.toFixed(1)}h</td>
                        <td className="p-3 text-right">{tech.hourly_rate}$</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          {tech.total_cost.toFixed(2)}$
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold">
                    <tr>
                      <td className="p-3" colSpan="2">
                        {lang === 'fr' ? 'TOTAL' : 'TOTAL'}
                      </td>
                      <td className="p-3 text-right">
                        {technicianReport.reduce((sum, t) => sum + t.total_hours, 0).toFixed(1)}h
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right text-green-700">
                        {technicianReport.reduce((sum, t) => sum + t.total_cost, 0).toFixed(2)}$
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="project" className="space-y-6">
              {/* Bar Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-4">
                  {lang === 'fr' ? 'Top 10 projets par heures' : 'Top 10 Projects by Hours'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#10b981" name={lang === 'fr' ? 'Heures' : 'Hours'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Projet' : 'Project'}
                      </th>
                      <th className="text-left p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Numéro' : 'Number'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Entrées' : 'Entries'}
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Heures' : 'Hours'}
                      </th>
                      <th className="text-left p-3 text-sm font-semibold">
                        {lang === 'fr' ? 'Techniciens' : 'Technicians'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectReport.map((project, idx) => (
                      <tr key={project.job_id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            >
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{project.job_title}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{project.job_number || '-'}</Badge>
                        </td>
                        <td className="p-3 text-right">{project.entries_count}</td>
                        <td className="p-3 text-right font-semibold">{project.total_hours.toFixed(1)}h</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {project.technicians.slice(0, 3).map((name, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {name.split(' ')[0]}
                              </Badge>
                            ))}
                            {project.technicians.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.technicians.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold">
                    <tr>
                      <td className="p-3" colSpan="2">
                        {lang === 'fr' ? 'TOTAL' : 'TOTAL'}
                      </td>
                      <td className="p-3 text-right">
                        {projectReport.reduce((sum, p) => sum + p.entries_count, 0)}
                      </td>
                      <td className="p-3 text-right">
                        {projectReport.reduce((sum, p) => sum + p.total_hours, 0).toFixed(1)}h
                      </td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
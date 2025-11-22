import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";

export default function ProfitabilityReports() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const currentTech = technicians.find(t => t.email === currentUser?.email);
  const isAdminOrManager = currentUser?.role === 'admin' || currentTech?.role === 'admin' || currentTech?.role === 'manager';

  const filteredJobs = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    return jobs.filter(job => {
      if (selectedStatus !== 'all' && job.status !== selectedStatus) return false;
      
      const jobDate = job.completed_at ? parseISO(job.completed_at) : 
                      job.created_date ? parseISO(job.created_date) : new Date();
      
      return isWithinInterval(jobDate, { start, end });
    }).map(job => {
      const revenue = job.invoice_total || 0;
      const cost = job.costs?.total_cost || 0;
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        ...job,
        revenue,
        cost,
        profit,
        margin
      };
    });
  }, [jobs, dateRange, selectedStatus]);

  const stats = useMemo(() => {
    const totalRevenue = filteredJobs.reduce((sum, job) => sum + job.revenue, 0);
    const totalCost = filteredJobs.reduce((sum, job) => sum + job.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = filteredJobs.length > 0 
      ? filteredJobs.reduce((sum, job) => sum + job.margin, 0) / filteredJobs.length 
      : 0;
    const profitableJobs = filteredJobs.filter(job => job.profit > 0).length;
    const unprofitableJobs = filteredJobs.filter(job => job.profit < 0).length;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin,
      profitableJobs,
      unprofitableJobs,
      totalJobs: filteredJobs.length
    };
  }, [filteredJobs]);

  const profitByJob = useMemo(() => {
    return filteredJobs
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(job => ({
        name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
        profit: parseFloat(job.profit.toFixed(2)),
        revenue: parseFloat(job.revenue.toFixed(2)),
        cost: parseFloat(job.cost.toFixed(2))
      }));
  }, [filteredJobs]);

  const marginDistribution = useMemo(() => {
    const ranges = [
      { name: '< 0%', count: 0 },
      { name: '0-10%', count: 0 },
      { name: '10-20%', count: 0 },
      { name: '20-30%', count: 0 },
      { name: '30-40%', count: 0 },
      { name: '> 40%', count: 0 }
    ];

    filteredJobs.forEach(job => {
      if (job.margin < 0) ranges[0].count++;
      else if (job.margin < 10) ranges[1].count++;
      else if (job.margin < 20) ranges[2].count++;
      else if (job.margin < 30) ranges[3].count++;
      else if (job.margin < 40) ranges[4].count++;
      else ranges[5].count++;
    });

    return ranges;
  }, [filteredJobs]);

  const handleExportCSV = () => {
    const headers = ['Job', 'Statut', 'Revenus', 'Coûts', 'Profit', 'Marge (%)'];
    const rows = filteredJobs.map(job => [
      job.title,
      job.status,
      job.revenue.toFixed(2),
      job.cost.toFixed(2),
      job.profit.toFixed(2),
      job.margin.toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rentabilite_${dateRange.start}_${dateRange.end}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const COLORS = ['#ef4444', '#f59e0b', '#fbbf24', '#84cc16', '#10b981', '#059669'];

  if (!isAdminOrManager) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
            <p className="text-slate-600">
              Les rapports de rentabilité sont réservés aux administrateurs et gestionnaires.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rapports de rentabilité</h1>
          <p className="text-slate-500 mt-1">Analyses financières détaillées par projet</p>
        </div>
        <Button onClick={handleExportCSV} disabled={filteredJobs.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Statut</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="todo">À faire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Revenus totaux</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coûts totaux</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalCost.toFixed(2)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Profit total</p>
                <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.totalProfit.toFixed(2)}
                </p>
              </div>
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Marge moyenne</p>
                <p className={`text-2xl font-bold ${stats.avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.avgMargin.toFixed(1)}%
                </p>
              </div>
              <Percent className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Projets rentables</p>
            <p className="text-3xl font-bold text-green-600">{stats.profitableJobs}</p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.totalJobs > 0 ? `${((stats.profitableJobs / stats.totalJobs) * 100).toFixed(0)}% des projets` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Projets non rentables</p>
            <p className="text-3xl font-bold text-red-600">{stats.unprofitableJobs}</p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.totalJobs > 0 ? `${((stats.unprofitableJobs / stats.totalJobs) * 100).toFixed(0)}% des projets` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Total projets</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalJobs}</p>
            <p className="text-xs text-slate-400 mt-1">Dans la période sélectionnée</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 profits */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Profits par projet</CardTitle>
          </CardHeader>
          <CardContent>
            {profitByJob.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitByJob} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution des marges */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des marges bénéficiaires</CardTitle>
          </CardHeader>
          <CardContent>
            {marginDistribution.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={marginDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {marginDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenus vs Coûts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus vs Coûts par projet</CardTitle>
          </CardHeader>
          <CardContent>
            {profitByJob.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitByJob}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenus" />
                  <Bar dataKey="cost" fill="#ef4444" name="Coûts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des projets ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">Projet</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-right p-3">Revenus</th>
                  <th className="text-right p-3">Coûts</th>
                  <th className="text-right p-3">Profit</th>
                  <th className="text-right p-3">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      Aucun projet pour cette période
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{job.title}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          job.status === 'completed' ? 'bg-green-100 text-green-700' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        ${job.revenue.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-semibold text-red-600">
                        ${job.cost.toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-bold ${job.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${job.profit.toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-bold ${job.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {job.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
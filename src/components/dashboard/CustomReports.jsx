import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Filter } from "lucide-react";
import { format } from "date-fns";

export default function CustomReports({ jobs, technicians, timeEntries, invoices }) {
  const [reportType, setReportType] = useState('jobs');
  const [dateFrom, setDateFrom] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [includeDetails, setIncludeDetails] = useState(true);

  const filteredData = useMemo(() => {
    let data = [];
    
    switch (reportType) {
      case 'jobs':
        data = jobs.filter(j => {
          const dateMatch = !j.scheduled_date || 
            (j.scheduled_date >= dateFrom && j.scheduled_date <= dateTo);
          const techMatch = selectedTechnician === 'all' || j.technician_id === selectedTechnician;
          const statusMatch = selectedStatus === 'all' || j.status === selectedStatus;
          return dateMatch && techMatch && statusMatch;
        });
        break;
      
      case 'time':
        data = timeEntries.filter(e => {
          const entryDate = format(new Date(e.clock_in), 'yyyy-MM-dd');
          const dateMatch = entryDate >= dateFrom && entryDate <= dateTo;
          const techMatch = selectedTechnician === 'all' || e.technician_id === selectedTechnician;
          return dateMatch && techMatch;
        });
        break;
      
      case 'invoices':
        data = invoices.filter(i => {
          const dateMatch = !i.issue_date || 
            (i.issue_date >= dateFrom && i.issue_date <= dateTo);
          const statusMatch = selectedStatus === 'all' || i.status === selectedStatus;
          return dateMatch && statusMatch;
        });
        break;
      
      case 'productivity':
        data = technicians.map(tech => {
          const techJobs = jobs.filter(j => 
            j.technician_id === tech.id &&
            j.scheduled_date >= dateFrom &&
            j.scheduled_date <= dateTo
          );
          const techEntries = timeEntries.filter(e => 
            e.technician_id === tech.id &&
            format(new Date(e.clock_in), 'yyyy-MM-dd') >= dateFrom &&
            format(new Date(e.clock_in), 'yyyy-MM-dd') <= dateTo
          );
          
          return {
            technician: `${tech.first_name} ${tech.last_name}`,
            totalJobs: techJobs.length,
            completedJobs: techJobs.filter(j => j.status === 'completed').length,
            totalHours: techEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0),
            avgTimePerJob: techJobs.length > 0 ? 
              techEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0) / techJobs.length : 0,
          };
        });
        break;
    }
    
    return data;
  }, [reportType, jobs, timeEntries, invoices, technicians, dateFrom, dateTo, selectedTechnician, selectedStatus]);

  const exportToCSV = () => {
    let headers = [];
    let rows = [];

    switch (reportType) {
      case 'jobs':
        headers = ['Date', 'Job', 'Client', 'Technicien', 'Statut', 'Type', 'Priorité', 'Durée'];
        rows = filteredData.map(j => [
          j.scheduled_date || '',
          j.title,
          j.customer_name,
          j.technician_name || 'Non assigné',
          j.status,
          j.service_type,
          j.priority,
          `${j.duration_minutes || 60} min`
        ]);
        break;
      
      case 'time':
        headers = ['Date', 'Technicien', 'Entrée', 'Sortie', 'Pause (min)', 'Total heures', 'Statut'];
        rows = filteredData.map(e => [
          format(new Date(e.clock_in), 'yyyy-MM-dd'),
          e.technician_name,
          format(new Date(e.clock_in), 'HH:mm'),
          e.clock_out ? format(new Date(e.clock_out), 'HH:mm') : 'En cours',
          e.break_minutes || 0,
          e.total_hours?.toFixed(2) || '',
          e.status
        ]);
        break;
      
      case 'invoices':
        headers = ['Numéro', 'Date', 'Client', 'Montant', 'Payé', 'Statut'];
        rows = filteredData.map(i => [
          i.invoice_number,
          i.issue_date,
          i.customer_name,
          `$${i.total_amount?.toFixed(2) || 0}`,
          `$${i.paid_amount?.toFixed(2) || 0}`,
          i.status
        ]);
        break;
      
      case 'productivity':
        headers = ['Technicien', 'Jobs totaux', 'Jobs complétés', 'Heures totales', 'Moy heures/job'];
        rows = filteredData.map(p => [
          p.technician,
          p.totalJobs,
          p.completedJobs,
          p.totalHours.toFixed(1),
          p.avgTimePerJob.toFixed(2)
        ]);
        break;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const generatePDF = () => {
    alert('Exportation PDF - Fonctionnalité à venir');
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Configuration du rapport
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Type de rapport</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jobs">Activité des jobs</SelectItem>
                <SelectItem value="time">Suivi du temps</SelectItem>
                <SelectItem value="invoices">Facturation</SelectItem>
                <SelectItem value="productivity">Productivité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date de début</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {reportType !== 'invoices' && (
            <div>
              <Label>Technicien</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(reportType === 'jobs' || reportType === 'invoices') && (
            <div>
              <Label>Statut</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {reportType === 'jobs' ? (
                    <>
                      <SelectItem value="scheduled">Planifié</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Complété</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="details"
              checked={includeDetails}
              onCheckedChange={setIncludeDetails}
            />
            <Label htmlFor="details">Inclure les détails complets</Label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Button onClick={generatePDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </Card>

      {/* Report Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Aperçu du rapport ({filteredData.length} entrée{filteredData.length > 1 ? 's' : ''})
          </h3>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {reportType === 'jobs' && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b-2">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Job</th>
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Technicien</th>
                  <th className="text-center p-2">Statut</th>
                  <th className="text-center p-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((job, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-2">{job.scheduled_date || '-'}</td>
                    <td className="p-2 font-medium">{job.title}</td>
                    <td className="p-2">{job.customer_name}</td>
                    <td className="p-2">{job.technician_name || 'Non assigné'}</td>
                    <td className="text-center p-2">{job.status}</td>
                    <td className="text-center p-2">{job.service_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'time' && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b-2">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Technicien</th>
                  <th className="text-center p-2">Entrée</th>
                  <th className="text-center p-2">Sortie</th>
                  <th className="text-center p-2">Total heures</th>
                  <th className="text-center p-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-2">{format(new Date(entry.clock_in), 'yyyy-MM-dd')}</td>
                    <td className="p-2 font-medium">{entry.technician_name}</td>
                    <td className="text-center p-2">{format(new Date(entry.clock_in), 'HH:mm')}</td>
                    <td className="text-center p-2">
                      {entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : 'En cours'}
                    </td>
                    <td className="text-center p-2">{entry.total_hours?.toFixed(2) || '-'}</td>
                    <td className="text-center p-2">{entry.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'productivity' && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b-2">
                <tr>
                  <th className="text-left p-2">Technicien</th>
                  <th className="text-center p-2">Jobs totaux</th>
                  <th className="text-center p-2">Complétés</th>
                  <th className="text-center p-2">Heures totales</th>
                  <th className="text-center p-2">Moy h/job</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{item.technician}</td>
                    <td className="text-center p-2">{item.totalJobs}</td>
                    <td className="text-center p-2">{item.completedJobs}</td>
                    <td className="text-center p-2">{item.totalHours.toFixed(1)}</td>
                    <td className="text-center p-2">{item.avgTimePerJob.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
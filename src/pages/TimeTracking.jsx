import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, Coffee, Calendar, Filter, Download } from "lucide-react";
import { format, differenceInMinutes, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import TimeEntryDialog from "../components/timetracking/TimeEntryDialog";
import TimeEntriesList from "../components/timetracking/TimeEntriesList";

export default function TimeTracking() {
  const [selectedTechnician, setSelectedTechnician] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.TimeEntry.list('-clock_in'),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const clockInMutation = useMutation({
    mutationFn: async (technicianId) => {
      const tech = technicians.find(t => t.id === technicianId);
      
      // Check if technician can punch outside GPS zone
      if (!tech.gps_punch_outside_zone) {
        // In a real app, you would check GPS location here
        // For now, we'll allow it but could add validation
      }
      
      return base44.entities.TimeEntry.create({
        technician_id: technicianId,
        technician_name: `${tech.first_name} ${tech.last_name}`,
        clock_in: new Date().toISOString(),
        status: "in_progress"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (entryId) => {
      const entry = timeEntries.find(e => e.id === entryId);
      const clockOut = new Date().toISOString();
      const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
      const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);
      
      return base44.entities.TimeEntry.update(entryId, {
        clock_out: clockOut,
        total_hours: parseFloat(totalHours),
        status: "completed"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setShowDialog(false);
      setSelectedEntry(null);
    },
  });

  const handleClockIn = (technicianId) => {
    clockInMutation.mutate(technicianId);
  };

  const handleClockOut = (entryId) => {
    if (confirm('Confirmer le poinçon de sortie?')) {
      clockOutMutation.mutate(entryId);
    }
  };

  const activeEntries = timeEntries.filter(e => e.status === 'in_progress');
  const weekStart = startOfWeek(new Date(selectedWeek), { locale: fr });
  const weekEnd = endOfWeek(new Date(selectedWeek), { locale: fr });

  const filteredEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.clock_in);
    const matchesWeek = entryDate >= weekStart && entryDate <= weekEnd;
    const matchesTech = selectedTechnician === 'all' || entry.technician_id === selectedTechnician;
    return matchesWeek && matchesTech;
  });

  const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Technicien', 'Arrivée', 'Départ', 'Pause (min)', 'Total Heures', 'Statut'];
    const rows = filteredEntries.map(entry => [
      format(new Date(entry.clock_in), 'yyyy-MM-dd'),
      entry.technician_name,
      format(new Date(entry.clock_in), 'HH:mm'),
      entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : '-',
      entry.break_minutes || 0,
      entry.total_hours || 0,
      entry.status === 'in_progress' ? 'En cours' : 'Complété'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pointage_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion du Temps</h1>
          <p className="text-slate-500 mt-1">Suivi des heures et poinçons des techniciens</p>
        </div>
      </div>

      {/* Active Clock Ins */}
      {activeEntries.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 animate-pulse" />
              Poinçons Actifs ({activeEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEntries.map(entry => (
                <div key={entry.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{entry.technician_name}</p>
                      <p className="text-xs text-slate-500">
                        Arrivée: {format(new Date(entry.clock_in), 'HH:mm')}
                      </p>
                    </div>
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <Button
                    onClick={() => handleClockOut(entry.id)}
                    className="w-full bg-red-600 hover:bg-red-700 mt-2"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Poinçon Sortie
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {technicians.map(tech => {
              const hasActiveEntry = activeEntries.some(e => e.technician_id === tech.id);
              return (
                <Button
                  key={tech.id}
                  onClick={() => !hasActiveEntry && handleClockIn(tech.id)}
                  disabled={hasActiveEntry}
                  variant={hasActiveEntry ? "secondary" : "outline"}
                  size="sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {tech.first_name} {tech.last_name}
                  {hasActiveEntry && " (En cours)"}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700">Technicien</label>
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
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

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700">Semaine</label>
          <Input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{filteredEntries.length}</p>
              <p className="text-sm text-slate-600 mt-1">Entrées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{totalHours.toFixed(2)}</p>
              <p className="text-sm text-slate-600 mt-1">Heures Totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{activeEntries.length}</p>
              <p className="text-sm text-slate-600 mt-1">En Cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {filteredEntries.filter(e => e.status === 'completed').length}
              </p>
              <p className="text-sm text-slate-600 mt-1">Complétés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries List */}
      <TimeEntriesList
        entries={filteredEntries}
        onEdit={(entry) => {
          setSelectedEntry(entry);
          setShowDialog(true);
        }}
        onDelete={(id) => {
          if (confirm('Supprimer cette entrée?')) {
            deleteEntryMutation.mutate(id);
          }
        }}
      />

      {showDialog && (
        <TimeEntryDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedEntry(null);
          }}
          onSave={(data) => {
            if (selectedEntry?.id) {
              updateEntryMutation.mutate({ id: selectedEntry.id, data });
            }
          }}
          entry={selectedEntry}
          technicians={technicians}
        />
      )}
    </div>
  );
}
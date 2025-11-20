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

  const { data: gpsZones = [] } = useQuery({
    queryKey: ['gpsZones'],
    queryFn: () => base44.entities.GPSZone.list(),
    initialData: [],
  });

  const checkGPSZone = (position, zones) => {
    for (const zone of zones) {
      if (!zone.active) continue;
      
      const distance = getDistanceFromLatLonInMeters(
        position.latitude,
        position.longitude,
        zone.latitude,
        zone.longitude
      );
      
      if (distance <= zone.radius) {
        return { inZone: true, zone };
      }
    }
    return { inZone: false, zone: null };
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius of earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI/180);

  const clockInMutation = useMutation({
    mutationFn: async (technicianId) => {
      const tech = technicians.find(t => t.id === technicianId);
      
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              const { inZone, zone } = checkGPSZone(coords, gpsZones);

              if (!tech.gps_punch_outside_zone && !inZone) {
                reject(new Error('Vous devez être dans une zone GPS autorisée pour poinçonner'));
                return;
              }

              // Create time entry
              const timeEntry = await base44.entities.TimeEntry.create({
                technician_id: technicianId,
                technician_name: `${tech.first_name} ${tech.last_name}`,
                clock_in: new Date().toISOString(),
                status: "in_progress",
                location_in: inZone ? zone.name : "Hors zone",
              });

              // Log GPS tracking
              await base44.entities.GPSTracking.create({
                technician_id: technicianId,
                technician_name: `${tech.first_name} ${tech.last_name}`,
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString(),
                activity_type: "punch_in",
              });

              resolve(timeEntry);
            },
            (error) => {
              if (!tech.gps_punch_outside_zone) {
                reject(new Error('Impossible d\'obtenir votre localisation GPS'));
              } else {
                // Allow punch without GPS if permitted
                base44.entities.TimeEntry.create({
                  technician_id: technicianId,
                  technician_name: `${tech.first_name} ${tech.last_name}`,
                  clock_in: new Date().toISOString(),
                  status: "in_progress",
                }).then(resolve).catch(reject);
              }
            }
          );
        } else {
          if (!tech.gps_punch_outside_zone) {
            reject(new Error('GPS non disponible sur cet appareil'));
          } else {
            base44.entities.TimeEntry.create({
              technician_id: technicianId,
              technician_name: `${tech.first_name} ${tech.last_name}`,
              clock_in: new Date().toISOString(),
              status: "in_progress",
            }).then(resolve).catch(reject);
          }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['gpsTracking'] });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (entryId) => {
      const entry = timeEntries.find(e => e.id === entryId);
      
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const clockOut = new Date().toISOString();
              const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
              const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);
              
              // Update time entry
              const updated = await base44.entities.TimeEntry.update(entryId, {
                clock_out: clockOut,
                total_hours: parseFloat(totalHours),
                status: "completed",
                location_out: "GPS enregistré",
              });

              // Log GPS tracking
              await base44.entities.GPSTracking.create({
                technician_id: entry.technician_id,
                technician_name: entry.technician_name,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: clockOut,
                activity_type: "punch_out",
              });

              resolve(updated);
            },
            (error) => {
              // Allow punch out even without GPS
              const clockOut = new Date().toISOString();
              const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
              const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);
              
              base44.entities.TimeEntry.update(entryId, {
                clock_out: clockOut,
                total_hours: parseFloat(totalHours),
                status: "completed",
              }).then(resolve).catch(reject);
            }
          );
        } else {
          const clockOut = new Date().toISOString();
          const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
          const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);
          
          base44.entities.TimeEntry.update(entryId, {
            clock_out: clockOut,
            total_hours: parseFloat(totalHours),
            status: "completed",
          }).then(resolve).catch(reject);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['gpsTracking'] });
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
                      {entry.location_in && (
                        <p className="text-xs text-green-600 mt-1">📍 {entry.location_in}</p>
                      )}
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
          <CardTitle className="text-lg">Poinçon Rapide (GPS)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Les poinçons utilisent automatiquement le GPS pour enregistrer la localisation et vérifier les zones autorisées.
          </p>
          <div className="flex flex-wrap gap-2">
            {technicians.map(tech => {
              const hasActiveEntry = activeEntries.some(e => e.technician_id === tech.id);
              return (
                <Button
                  key={tech.id}
                  onClick={() => !hasActiveEntry && handleClockIn(tech.id)}
                  disabled={hasActiveEntry || clockInMutation.isPending}
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
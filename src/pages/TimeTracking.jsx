import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, LogIn, LogOut, Download, DollarSign, BarChart3, CalendarDays } from "lucide-react";
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import TimeEntryDialog from "@/components/timetracking/TimeEntryDialog";
import TimeEntriesList from "@/components/timetracking/TimeEntriesList";
import TimeCalendarView from "@/components/timetracking/TimeCalendarView";
import TimeReportsPanel from "@/components/timetracking/TimeReportsPanel";
import TimeInvoiceGenerator from "@/components/timetracking/TimeInvoiceGenerator";
import { useTranslation } from "@/components/shared/translations";

export default function TimeTracking() {
  const [selectedTechnician, setSelectedTechnician] = useState("all");
  const [dateRange, setDateRange] = useState("week");
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  
  const queryClient = useQueryClient();

  const { data: languageSettings } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.LanguageSettings.list();
      return settings[0] || { language: 'fr' };
    },
  });

  const lang = languageSettings?.language || 'fr';
  const t = useTranslation(lang);

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

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
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
    const R = 6371000;
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
      /**
       * AUDIT FIX: High Priority Issue #9 - Prevent Duplicate Clock-Ins
       * Check for existing active time entry before allowing clock-in
       */
      const tech = technicians.find(t => t.id === technicianId);

      // VALIDATION: Check if technician already has an active entry (not clocked out)
      const activeEntries = await base44.entities.TimeEntry.filter({
        technician_id: technicianId,
        clock_out: null
      });

      if (activeEntries && activeEntries.length > 0) {
        throw new Error(
          `${tech.first_name} ${tech.last_name} est déjà pointé. Veuillez pointer la sortie avant de pointer à nouveau.`
        );
      }

      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              /**
               * AUDIT FIX: High Priority Issue #10 - GPS Accuracy Validation (MEDIUM #24)
               * Validate GPS accuracy before accepting clock-in
               */
              const accuracy = position.coords.accuracy;

              // VALIDATION: GPS accuracy must be within 50 meters for reliable location
              if (accuracy > 50) {
                reject(new Error(
                  `Précision GPS insuffisante: ${accuracy.toFixed(0)}m. Déplacez-vous vers un endroit avec une meilleure réception GPS (< 50m requis).`
                ));
                return;
              }

              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              const { inZone, zone } = checkGPSZone(coords, gpsZones);

              if (!tech.gps_punch_outside_zone && !inZone) {
                reject(new Error('Vous devez être dans une zone GPS autorisée pour poinçonner'));
                return;
              }

              /**
               * AUDIT FIX: High Priority Issue #13 - Comprehensive Audit Logging
               * Add activity log for normal clock-in operations
               */
              const timeEntry = await base44.entities.TimeEntry.create({
                technician_id: technicianId,
                technician_name: `${tech.first_name} ${tech.last_name}`,
                clock_in: new Date().toISOString(),
                status: "in_progress",
                location_in: inZone ? zone.name : "Hors zone",
                activity_log: [{
                  timestamp: new Date().toISOString(),
                  action: "clock_in",
                  details: `Clock-in à ${inZone ? zone.name : "hors zone"}. GPS: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} (précision: ${accuracy.toFixed(0)}m)`,
                  user: `${tech.first_name} ${tech.last_name}`,
                  location: inZone ? zone.name : "Hors zone",
                  gps_accuracy: accuracy
                }]
              });

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
            async (error) => {
              /**
               * AUDIT FIX: High Priority Issue #10 - GPS Bypass Logging
               * Log all GPS bypass attempts for audit trail
               */
              if (!tech.gps_punch_outside_zone) {
                reject(new Error('Impossible d\'obtenir votre localisation GPS'));
              } else {
                // Log GPS bypass for audit trail
                await base44.entities.GPSTracking.create({
                  technician_id: technicianId,
                  technician_name: `${tech.first_name} ${tech.last_name}`,
                  latitude: null,
                  longitude: null,
                  accuracy: null,
                  timestamp: new Date().toISOString(),
                  activity_type: "punch_in",
                  notes: `GPS_BYPASS: Location unavailable. Error: ${error.message}. Permission: gps_punch_outside_zone granted.`
                });

                const timeEntry = await base44.entities.TimeEntry.create({
                  technician_id: technicianId,
                  technician_name: `${tech.first_name} ${tech.last_name}`,
                  clock_in: new Date().toISOString(),
                  status: "in_progress",
                  location_in: "GPS non disponible (bypass autorisé)",
                  activity_log: [{
                    timestamp: new Date().toISOString(),
                    action: "gps_bypass",
                    details: `Clock-in sans GPS. Raison: ${error.message}. Permission accordée.`,
                    user: `${tech.first_name} ${tech.last_name}`
                  }]
                });
                resolve(timeEntry);
              }
            }
          );
        } else {
          /**
           * AUDIT FIX: High Priority Issue #10 - GPS Bypass Logging
           * Log when geolocation is not available on device
           */
          if (!tech.gps_punch_outside_zone) {
            reject(new Error('GPS non disponible sur cet appareil'));
          } else {
            // Log GPS bypass for audit trail
            await base44.entities.GPSTracking.create({
              technician_id: technicianId,
              technician_name: `${tech.first_name} ${tech.last_name}`,
              latitude: null,
              longitude: null,
              accuracy: null,
              timestamp: new Date().toISOString(),
              activity_type: "punch_in",
              notes: "GPS_BYPASS: Geolocation not supported by device. Permission: gps_punch_outside_zone granted."
            });

            const timeEntry = await base44.entities.TimeEntry.create({
              technician_id: technicianId,
              technician_name: `${tech.first_name} ${tech.last_name}`,
              clock_in: new Date().toISOString(),
              status: "in_progress",
              location_in: "GPS non disponible (bypass autorisé)",
              activity_log: [{
                timestamp: new Date().toISOString(),
                action: "gps_bypass",
                details: "Clock-in sans GPS. Raison: Appareil ne supporte pas la géolocalisation. Permission accordée.",
                user: `${tech.first_name} ${tech.last_name}`
              }]
            });
            resolve(timeEntry);
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
              /**
               * AUDIT FIX: High Priority Issue #10 - GPS Accuracy Validation (MEDIUM #24)
               * Validate GPS accuracy for clock-out as well
               */
              const accuracy = position.coords.accuracy;
              const clockOut = new Date().toISOString();
              const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
              const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);

              // Log if GPS accuracy is poor (but still allow clock-out - don't trap workers)
              const locationOut = accuracy > 50
                ? `GPS imprécis (${accuracy.toFixed(0)}m)`
                : "GPS enregistré";

              /**
               * AUDIT FIX: High Priority Issue #13 - Comprehensive Audit Logging
               * Add activity log for clock-out operations
               */
              const updated = await base44.entities.TimeEntry.update(entryId, {
                clock_out: clockOut,
                total_hours: parseFloat(totalHours),
                status: "completed",
                location_out: locationOut,
                activity_log: [
                  ...(entry.activity_log || []),
                  {
                    timestamp: clockOut,
                    action: "clock_out",
                    details: `Clock-out après ${totalHours}h travaillées${entry.break_minutes ? ` (dont ${entry.break_minutes}min de pause)` : ''}. GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} (précision: ${accuracy.toFixed(0)}m)`,
                    user: entry.technician_name,
                    total_hours: parseFloat(totalHours),
                    gps_accuracy: accuracy
                  },
                  ...(accuracy > 50 ? [{
                    timestamp: clockOut,
                    action: "gps_warning",
                    details: `GPS imprécis lors du clock-out: ${accuracy.toFixed(0)}m (> 50m recommandé)`,
                    user: entry.technician_name
                  }] : [])
                ]
              });

              await base44.entities.GPSTracking.create({
                technician_id: entry.technician_id,
                technician_name: entry.technician_name,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: clockOut,
                activity_type: "punch_out",
                notes: accuracy > 50 ? `GPS_WARNING: Poor accuracy (${accuracy.toFixed(0)}m > 50m threshold)` : null
              });

              resolve(updated);
            },
            async (error) => {
              /**
               * AUDIT FIX: High Priority Issue #10 - GPS Bypass Logging
               * Log GPS bypass on clock-out (but still allow - don't trap workers)
               */
              const clockOut = new Date().toISOString();
              const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
              const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);

              // Log GPS bypass for audit trail
              await base44.entities.GPSTracking.create({
                technician_id: entry.technician_id,
                technician_name: entry.technician_name,
                latitude: null,
                longitude: null,
                accuracy: null,
                timestamp: clockOut,
                activity_type: "punch_out",
                notes: `GPS_BYPASS: Clock-out without GPS. Error: ${error.message}`
              });

              const updated = await base44.entities.TimeEntry.update(entryId, {
                clock_out: clockOut,
                total_hours: parseFloat(totalHours),
                status: "completed",
                location_out: "GPS non disponible",
                activity_log: [
                  ...(entry.activity_log || []),
                  {
                    timestamp: clockOut,
                    action: "gps_bypass",
                    details: `Clock-out sans GPS. Raison: ${error.message}`,
                    user: entry.technician_name
                  }
                ]
              });
              resolve(updated);
            }
          );
        } else {
          /**
           * AUDIT FIX: High Priority Issue #10 - GPS Bypass Logging
           * Log when geolocation not available on device for clock-out
           */
          const clockOut = new Date().toISOString();
          const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(entry.clock_in));
          const totalHours = ((totalMinutes - (entry.break_minutes || 0)) / 60).toFixed(2);

          // Log GPS bypass for audit trail
          await base44.entities.GPSTracking.create({
            technician_id: entry.technician_id,
            technician_name: entry.technician_name,
            latitude: null,
            longitude: null,
            accuracy: null,
            timestamp: clockOut,
            activity_type: "punch_out",
            notes: "GPS_BYPASS: Clock-out without GPS. Geolocation not supported by device."
          });

          const updated = await base44.entities.TimeEntry.update(entryId, {
            clock_out: clockOut,
            total_hours: parseFloat(totalHours),
            status: "completed",
            location_out: "GPS non disponible",
            activity_log: [
              ...(entry.activity_log || []),
              {
                timestamp: clockOut,
                action: "gps_bypass",
                details: "Clock-out sans GPS. Raison: Appareil ne supporte pas la géolocalisation.",
                user: entry.technician_name
              }
            ]
          });
          resolve(updated);
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
    if (confirm(lang === 'fr' ? 'Confirmer le poinçon de sortie?' : 'Confirm clock out?')) {
      clockOutMutation.mutate(entryId);
    }
  };

  const activeEntries = timeEntries.filter(e => e.status === 'in_progress');

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return { startDate: startOfWeek(now, { locale: fr }), endDate: endOfWeek(now, { locale: fr }) };
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'custom':
        return { startDate: new Date(customStartDate), endDate: new Date(customEndDate) };
      default:
        return { startDate: startOfWeek(now, { locale: fr }), endDate: endOfWeek(now, { locale: fr }) };
    }
  }, [dateRange, customStartDate, customEndDate]);

  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.clock_in);
      const matchesDate = entryDate >= startDate && entryDate <= endDate;
      const matchesTech = selectedTechnician === 'all' || entry.technician_id === selectedTechnician;
      return matchesDate && matchesTech;
    });
  }, [timeEntries, startDate, endDate, selectedTechnician]);

  const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Technicien', 'Arrivée', 'Départ', 'Pause (min)', 'Total Heures', 'Job', 'Statut'];
    const rows = filteredEntries.map(entry => [
      format(new Date(entry.clock_in), 'yyyy-MM-dd'),
      entry.technician_name,
      format(new Date(entry.clock_in), 'HH:mm'),
      entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : '-',
      entry.break_minutes || 0,
      entry.total_hours || 0,
      entry.job_id ? jobs.find(j => j.id === entry.job_id)?.title || '-' : '-',
      entry.status === 'in_progress' ? 'En cours' : 'Complété'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pointage_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('timeTracking')}</h1>
          <p className="text-slate-500 mt-1">
            {lang === 'fr' ? 'Suivi des heures et poinçons des techniciens' : 'Time tracking and technician punches'}
          </p>
        </div>
      </div>

      {/* Active Clock Ins */}
      {activeEntries.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 animate-pulse" />
              {lang === 'fr' ? 'Poinçons Actifs' : 'Active Punches'} ({activeEntries.length})
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
                        {lang === 'fr' ? 'Arrivée' : 'Started'}: {format(new Date(entry.clock_in), 'HH:mm')}
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
                    {lang === 'fr' ? 'Poinçon Sortie' : 'Clock Out'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Punch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {lang === 'fr' ? 'Poinçon Rapide (GPS)' : 'Quick Punch (GPS)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            {lang === 'fr' 
              ? 'Les poinçons utilisent automatiquement le GPS pour enregistrer la localisation.' 
              : 'Punches automatically use GPS to record location.'}
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
                  {hasActiveEntry && ` (${lang === 'fr' ? 'En cours' : 'Active'})`}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700">{t('technician')}</label>
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'fr' ? 'Tous les techniciens' : 'All technicians'}</SelectItem>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700">{lang === 'fr' ? 'Période' : 'Period'}</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{lang === 'fr' ? 'Cette semaine' : 'This week'}</SelectItem>
              <SelectItem value="month">{lang === 'fr' ? 'Ce mois' : 'This month'}</SelectItem>
              <SelectItem value="custom">{lang === 'fr' ? 'Personnalisé' : 'Custom'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRange === 'custom' && (
          <>
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-slate-700">{lang === 'fr' ? 'De' : 'From'}</label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-slate-700">{lang === 'fr' ? 'À' : 'To'}</label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </>
        )}

        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {lang === 'fr' ? 'Exporter CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{filteredEntries.length}</p>
              <p className="text-sm text-slate-600 mt-1">{lang === 'fr' ? 'Entrées' : 'Entries'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{totalHours.toFixed(2)}</p>
              <p className="text-sm text-slate-600 mt-1">{lang === 'fr' ? 'Heures Totales' : 'Total Hours'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{activeEntries.length}</p>
              <p className="text-sm text-slate-600 mt-1">{lang === 'fr' ? 'En Cours' : 'Active'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {filteredEntries.filter(e => e.status === 'completed').length}
              </p>
              <p className="text-sm text-slate-600 mt-1">{lang === 'fr' ? 'Complétés' : 'Completed'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {lang === 'fr' ? 'Liste' : 'List'}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {lang === 'fr' ? 'Calendrier' : 'Calendar'}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {lang === 'fr' ? 'Rapports' : 'Reports'}
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {lang === 'fr' ? 'Facturation' : 'Invoicing'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <TimeEntriesList
            entries={filteredEntries}
            onEdit={(entry) => {
              setSelectedEntry(entry);
              setShowDialog(true);
            }}
            onDelete={(id) => {
              if (confirm(lang === 'fr' ? 'Supprimer cette entrée?' : 'Delete this entry?')) {
                deleteEntryMutation.mutate(id);
              }
            }}
            lang={lang}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <TimeCalendarView
            entries={filteredEntries}
            technicians={technicians}
            startDate={startDate}
            endDate={endDate}
            lang={lang}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <TimeReportsPanel
            entries={filteredEntries}
            technicians={technicians}
            jobs={jobs}
            startDate={startDate}
            endDate={endDate}
            lang={lang}
          />
        </TabsContent>

        <TabsContent value="invoice" className="mt-6">
          <TimeInvoiceGenerator
            entries={filteredEntries}
            technicians={technicians}
            jobs={jobs}
            lang={lang}
          />
        </TabsContent>
      </Tabs>

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
          lang={lang}
        />
      )}
    </div>
  );
}
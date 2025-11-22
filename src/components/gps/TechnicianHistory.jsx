import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle } from "react-leaflet";
import { format, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Navigation, Clock, Download, Filter } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function TechnicianHistory({ technicians, selectedTechnician, onSelectTechnician }) {
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeEnd, setDateRangeEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedJob, setSelectedJob] = useState('all');

  const { data: trackingData = [] } = useQuery({
    queryKey: ['gpsTracking', selectedTechnician?.id, dateFilter, dateRangeEnd],
    queryFn: () => base44.entities.GPSTracking.list('-timestamp', 5000),
    enabled: !!selectedTechnician,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: gpsZones = [] } = useQuery({
    queryKey: ['gpsZones'],
    queryFn: () => base44.entities.GPSZone.list(),
  });

  const filteredData = trackingData.filter(t => {
    if (!selectedTechnician || t.technician_id !== selectedTechnician.id) return false;
    
    const trackDate = new Date(t.timestamp);
    const startDate = startOfDay(new Date(dateFilter));
    const endDate = endOfDay(new Date(dateRangeEnd));
    
    const dateMatch = trackDate >= startDate && trackDate <= endDate;
    const jobMatch = selectedJob === 'all' || t.job_id === selectedJob;
    
    return dateMatch && jobMatch;
  });

  const pathCoordinates = filteredData.map(t => [t.latitude, t.longitude]);

  const activityColors = {
    punch_in: '#22c55e',
    punch_out: '#ef4444',
    job_start: '#3b82f6',
    job_end: '#8b5cf6',
    location_update: '#64748b',
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ['Timestamp', 'Activité', 'Latitude', 'Longitude', 'Vitesse (km/h)', 'Précision (m)', 'Job'];
    const rows = filteredData.map(point => [
      format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      point.activity_type,
      point.latitude,
      point.longitude,
      point.speed?.toFixed(1) || '0',
      point.accuracy?.toFixed(0) || 'N/A',
      point.job_id || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gps_${selectedTechnician.first_name}_${selectedTechnician.last_name}_${dateFilter}.csv`;
    link.click();
  };

  const exportToGeoJSON = () => {
    if (filteredData.length === 0) return;

    const geojson = {
      type: "FeatureCollection",
      features: filteredData.map(point => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.longitude, point.latitude]
        },
        properties: {
          timestamp: point.timestamp,
          activity_type: point.activity_type,
          speed: point.speed,
          accuracy: point.accuracy,
          technician: point.technician_name,
          job_id: point.job_id
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gps_${selectedTechnician.first_name}_${selectedTechnician.last_name}_${dateFilter}.geojson`;
    link.click();
  };

  const totalDistance = filteredData.reduce((acc, point, idx) => {
    if (idx === 0) return 0;
    const prev = filteredData[idx - 1];
    const R = 6371000; // Earth radius in meters
    const dLat = (point.latitude - prev.latitude) * Math.PI / 180;
    const dLon = (point.longitude - prev.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(prev.latitude * Math.PI / 180) * Math.cos(point.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return acc + (R * c);
  }, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <h3 className="font-semibold">Filtres</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Technicien</Label>
              <Select 
                value={selectedTechnician?.id || ""} 
                onValueChange={(id) => onSelectTechnician(technicians.find(t => t.id === id))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>

            <div>
              <Label>Job</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les jobs</SelectItem>
                  {jobs.filter(j => j.technician_id === selectedTechnician?.id).map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTechnician && filteredData.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={exportToGeoJSON} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export GeoJSON
              </Button>
            </div>
          )}
        </div>
      </Card>

      {selectedTechnician && filteredData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Points GPS</p>
              <p className="text-2xl font-bold">{filteredData.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Distance totale</p>
              <p className="text-2xl font-bold">{(totalDistance / 1000).toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Vitesse max</p>
              <p className="text-2xl font-bold">
                {Math.max(...filteredData.map(d => d.speed || 0)).toFixed(0)} km/h
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Vitesse moy</p>
              <p className="text-2xl font-bold">
                {(filteredData.reduce((acc, d) => acc + (d.speed || 0), 0) / filteredData.length).toFixed(0)} km/h
              </p>
            </div>
          </div>
        </Card>
      )}

      {selectedTechnician && filteredData.length > 0 && (
        <>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Carte de déplacement</h3>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={pathCoordinates[0]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* GPS Zones */}
                {gpsZones.filter(z => z.active).map(zone => (
                  <Circle
                    key={zone.id}
                    center={[zone.latitude, zone.longitude]}
                    radius={zone.radius}
                    pathOptions={{ 
                      color: '#3b82f6', 
                      fillColor: '#3b82f6', 
                      fillOpacity: 0.1 
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">{zone.name}</p>
                        <p className="text-xs text-slate-600">Rayon: {zone.radius}m</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
                
                {/* Path line */}
                <Polyline
                  positions={pathCoordinates}
                  pathOptions={{ color: selectedTechnician.color || '#3b82f6', weight: 3 }}
                />

                {/* Activity markers */}
                {filteredData.filter(t => t.activity_type !== 'location_update').map((point, idx) => (
                  <Marker key={idx} position={[point.latitude, point.longitude]}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">
                          {point.activity_type === 'punch_in' && 'Poinçon Entrée'}
                          {point.activity_type === 'punch_out' && 'Poinçon Sortie'}
                          {point.activity_type === 'job_start' && 'Début Job'}
                          {point.activity_type === 'job_end' && 'Fin Job'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {format(new Date(point.timestamp), 'HH:mm:ss', { locale: fr })}
                        </p>
                        {point.speed > 0 && (
                          <p className="text-xs text-slate-500">
                            Vitesse: {point.speed.toFixed(0)} km/h
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Chronologie des activités</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredData.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: activityColors[point.activity_type] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {point.activity_type === 'punch_in' && '🟢 Poinçon Entrée'}
                        {point.activity_type === 'punch_out' && '🔴 Poinçon Sortie'}
                        {point.activity_type === 'job_start' && '🔵 Début Job'}
                        {point.activity_type === 'job_end' && '🟣 Fin Job'}
                        {point.activity_type === 'location_update' && '📍 Localisation'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(point.timestamp), 'HH:mm:ss', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                      </span>
                      {point.speed > 0 && (
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {point.speed.toFixed(0)} km/h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {selectedTechnician && filteredData.length === 0 && (
        <Card className="p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Aucune donnée GPS pour cette date</p>
        </Card>
      )}
    </div>
  );
}
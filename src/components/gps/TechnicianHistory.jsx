import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Navigation, Clock } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function TechnicianHistory({ technicians, selectedTechnician, onSelectTechnician }) {
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: trackingData = [] } = useQuery({
    queryKey: ['gpsTracking', selectedTechnician?.id, dateFilter],
    queryFn: () => base44.entities.GPSTracking.list('-timestamp', 1000),
    enabled: !!selectedTechnician,
  });

  const filteredData = trackingData.filter(t => {
    if (!selectedTechnician || t.technician_id !== selectedTechnician.id) return false;
    if (!dateFilter) return true;
    const trackDate = format(new Date(t.timestamp), 'yyyy-MM-dd');
    return trackDate === dateFilter;
  });

  const pathCoordinates = filteredData.map(t => [t.latitude, t.longitude]);

  const activityColors = {
    punch_in: '#22c55e',
    punch_out: '#ef4444',
    job_start: '#3b82f6',
    job_end: '#8b5cf6',
    location_update: '#64748b',
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label>Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

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
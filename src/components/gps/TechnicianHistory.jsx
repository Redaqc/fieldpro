import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { format } from "date-fns";
import { MapPin, Clock } from "lucide-react";

export default function TechnicianHistory() {
  const [selectedTech, setSelectedTech] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['gpsLocations', selectedTech, selectedDate],
    queryFn: () => base44.entities.GPSLocation.list('-timestamp', 1000),
    enabled: !!selectedTech,
  });

  const filteredLocations = locations.filter(loc => {
    if (loc.technician_id !== selectedTech) return false;
    const locDate = format(new Date(loc.timestamp), 'yyyy-MM-dd');
    return locDate === selectedDate;
  });

  const pathCoordinates = filteredLocations.map(loc => [loc.latitude, loc.longitude]);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Technicien</Label>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {selectedTech && filteredLocations.length > 0 && (
          <div className="h-[500px] border rounded-lg overflow-hidden">
            <MapContainer
              center={pathCoordinates[0] || [45.5017, -73.5673]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {/* Path */}
              {pathCoordinates.length > 1 && (
                <Polyline positions={pathCoordinates} color="blue" weight={3} />
              )}

              {/* Markers for clock in/out */}
              {filteredLocations
                .filter(loc => loc.activity === 'clock_in' || loc.activity === 'clock_out')
                .map((loc, idx) => (
                  <Marker key={idx} position={[loc.latitude, loc.longitude]}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">
                          {loc.activity === 'clock_in' ? 'Arrivée' : 'Départ'}
                        </p>
                        <p className="text-xs">
                          {format(new Date(loc.timestamp), 'HH:mm:ss')}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        )}

        {selectedTech && filteredLocations.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            Aucune donnée GPS pour cette date
          </p>
        )}
      </Card>

      {selectedTech && filteredLocations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Détails des déplacements</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredLocations.map((loc, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 border-b">
                {loc.activity === 'clock_in' ? (
                  <Clock className="w-4 h-4 text-green-600" />
                ) : loc.activity === 'clock_out' ? (
                  <Clock className="w-4 h-4 text-red-600" />
                ) : (
                  <MapPin className="w-4 h-4 text-blue-600" />
                )}
                <div className="flex-1">
                  <p className="text-sm">
                    {loc.activity === 'clock_in' && 'Arrivée'}
                    {loc.activity === 'clock_out' && 'Départ'}
                    {loc.activity === 'tracking' && 'Position'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(loc.timestamp), 'HH:mm:ss')}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
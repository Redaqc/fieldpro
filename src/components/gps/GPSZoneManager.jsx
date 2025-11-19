import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from "react-leaflet";

function LocationPicker({ onLocationSelect, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function GPSZoneManager() {
  const [newZone, setNewZone] = useState({
    name: "",
    job_id: "",
    center_lat: 45.5017,
    center_lng: -73.5673,
    radius_meters: 100
  });
  const queryClient = useQueryClient();

  const { data: zones = [] } = useQuery({
    queryKey: ['gpsZones'],
    queryFn: () => base44.entities.GPSZone.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GPSZone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsZones'] });
      setNewZone({
        name: "",
        job_id: "",
        center_lat: 45.5017,
        center_lng: -73.5673,
        radius_meters: 100
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GPSZone.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsZones'] });
    },
  });

  const handleJobSelect = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    setNewZone({
      ...newZone,
      job_id: jobId,
      job_name: job ? job.title : "",
      name: job ? `Zone - ${job.title}` : ""
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Créer une nouvelle zone GPS</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Projet</Label>
            <Select value={newZone.job_id} onValueChange={handleJobSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number} - {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nom de la zone</Label>
            <Input
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              placeholder="Ex: Chantier principal"
            />
          </div>
          <div>
            <Label>Rayon (mètres)</Label>
            <Input
              type="number"
              value={newZone.radius_meters}
              onChange={(e) => setNewZone({ ...newZone, radius_meters: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">Cliquez sur la carte pour définir le centre de la zone</Label>
          <div className="h-[400px] border rounded-lg overflow-hidden">
            <MapContainer
              center={[newZone.center_lat, newZone.center_lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker
                onLocationSelect={(latlng) => {
                  setNewZone({
                    ...newZone,
                    center_lat: latlng.lat,
                    center_lng: latlng.lng
                  });
                }}
                initialPosition={[newZone.center_lat, newZone.center_lng]}
              />
              <Circle
                center={[newZone.center_lat, newZone.center_lng]}
                radius={newZone.radius_meters}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
              />
            </MapContainer>
          </div>
        </div>

        <Button
          onClick={() => createMutation.mutate(newZone)}
          disabled={!newZone.name || !newZone.job_id}
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer la zone
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Zones existantes</h3>
        <div className="space-y-3">
          {zones.map(zone => (
            <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-sm text-slate-500">{zone.job_name}</p>
                  <p className="text-xs text-slate-400">Rayon: {zone.radius_meters}m</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Supprimer cette zone?')) {
                    deleteMutation.mutate(zone.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
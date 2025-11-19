import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Clock } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function GPSTracking() {
  const [selectedTech, setSelectedTech] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['gpsLocations'],
    queryFn: () => base44.entities.GPSLocation.list('-timestamp', 100),
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['gpsZones'],
    queryFn: () => base44.entities.GPSZone.list(),
  });

  // Get latest location for each technician
  const latestLocations = {};
  locations.forEach(loc => {
    if (!latestLocations[loc.technician_id] || 
        new Date(loc.timestamp) > new Date(latestLocations[loc.technician_id].timestamp)) {
      latestLocations[loc.technician_id] = loc;
    }
  });

  const activeTechnicians = Object.values(latestLocations).filter(loc => {
    const locationTime = new Date(loc.timestamp);
    const now = new Date();
    const diffMinutes = (now - locationTime) / 1000 / 60;
    return diffMinutes < 30; // Active in last 30 minutes
  });

  const defaultCenter = [45.5017, -73.5673]; // Montreal

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suivi GPS</h1>
          <p className="text-slate-500 mt-1">
            {activeTechnicians.length} technicien{activeTechnicians.length > 1 ? 's' : ''} actif{activeTechnicians.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant={autoRefresh ? "default" : "outline"}
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {autoRefresh ? "Actualisation auto" : "Actualisation manuelle"}
        </Button>
      </div>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">Carte en temps réel</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="zones">Zones GPS</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="col-span-3 p-0 overflow-hidden h-[600px]">
              <MapContainer
                center={defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {/* Technician Markers */}
                {activeTechnicians.map(loc => {
                  const tech = technicians.find(t => t.id === loc.technician_id);
                  if (!tech) return null;
                  
                  return (
                    <Marker
                      key={loc.id}
                      position={[loc.latitude, loc.longitude]}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-semibold">{loc.technician_name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(loc.timestamp).toLocaleTimeString('fr-FR')}
                          </p>
                          <p className="text-xs">Précision: {loc.accuracy?.toFixed(0)}m</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* GPS Zones */}
                {zones.filter(z => z.active).map(zone => (
                  <Circle
                    key={zone.id}
                    center={[zone.center_lat, zone.center_lng]}
                    radius={zone.radius_meters}
                    pathOptions={{
                      color: 'blue',
                      fillColor: 'blue',
                      fillOpacity: 0.1
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">{zone.name}</p>
                        <p className="text-xs">{zone.job_name}</p>
                        <p className="text-xs">Rayon: {zone.radius_meters}m</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </Card>

            <Card className="p-4 h-[600px] overflow-y-auto">
              <h3 className="font-semibold mb-4">Techniciens actifs</h3>
              <div className="space-y-3">
                {activeTechnicians.map(loc => {
                  const tech = technicians.find(t => t.id === loc.technician_id);
                  if (!tech) return null;

                  const locationTime = new Date(loc.timestamp);
                  const now = new Date();
                  const diffMinutes = Math.floor((now - locationTime) / 1000 / 60);

                  return (
                    <div
                      key={loc.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedTech(tech)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {tech.avatar_url ? (
                          <img src={tech.avatar_url} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: tech.color }}
                          >
                            {tech.first_name[0]}{tech.last_name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{loc.technician_name}</p>
                          <p className="text-xs text-slate-500">
                            {diffMinutes === 0 ? 'À l\'instant' : `Il y a ${diffMinutes} min`}
                          </p>
                        </div>
                        <Badge variant={diffMinutes < 5 ? "default" : "secondary"}>
                          <MapPin className="w-3 h-3" />
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <p className="text-slate-500 text-center">Sélectionnez un technicien pour voir son historique</p>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card className="p-6">
            <p className="text-slate-500 text-center">Gestion des zones GPS</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
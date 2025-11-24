import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Navigation, Clock, Users } from "lucide-react";

import LiveTrackingMap from "../components/gps/LiveTrackingMap";
import GPSZoneManager from "../components/gps/GPSZoneManager";
import TechnicianHistory from "../components/gps/TechnicianHistory";
import GeofenceAlerts from "../components/gps/GeofenceAlerts";

export default function GPSTracking() {
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: gpsZones = [] } = useQuery({
    queryKey: ['gpsZones'],
    queryFn: () => base44.entities.GPSZone.list(),
  });

  const { data: trackingData = [] } = useQuery({
    queryKey: ['gpsTracking'],
    queryFn: () => base44.entities.GPSTracking.list('-timestamp', 100),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  // Get latest position for each technician
  const latestPositions = technicians.map(tech => {
    const techTracking = trackingData.filter(t => t.technician_id === tech.id);
    const latest = techTracking.length > 0 ? techTracking[0] : null;
    return {
      ...tech,
      lastPosition: latest,
    };
  }).filter(t => t.lastPosition);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suivi GPS</h1>
          <p className="text-slate-500 mt-1">Suivi en temps réel des techniciens</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Techniciens actifs</p>
              <p className="text-2xl font-bold text-green-600">{latestPositions.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Zones GPS</p>
              <p className="text-2xl font-bold text-blue-600">{gpsZones.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">En déplacement</p>
              <p className="text-2xl font-bold text-orange-600">
                {latestPositions.filter(t => t.lastPosition?.speed > 5).length}
              </p>
            </div>
            <Navigation className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Points suivis</p>
              <p className="text-2xl font-bold text-purple-600">{trackingData.length}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList>
          <TabsTrigger value="live">Carte en direct</TabsTrigger>
          <TabsTrigger value="zones">Zones GPS</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          <LiveTrackingMap
            technicians={latestPositions}
            zones={gpsZones}
            onTechnicianClick={setSelectedTechnician}
          />
        </TabsContent>

        <TabsContent value="zones" className="mt-6">
          <GPSZoneManager zones={gpsZones} jobs={jobs} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <TechnicianHistory
            technicians={technicians}
            selectedTechnician={selectedTechnician}
            onSelectTechnician={setSelectedTechnician}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <GeofenceAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
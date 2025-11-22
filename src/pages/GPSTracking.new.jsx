import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Navigation, Clock, Users } from "lucide-react";

// NEW: Import our custom hooks
import { useTechnicians } from "@/hooks/useTechnicians";
import { useGpsZoness } from "@/hooks/useGpsZoness";
import { useGpsTrackings } from "@/hooks/useGpsTrackings";
import { useJobs } from "@/hooks/useJobs";

import LiveTrackingMap from "../components/gps/LiveTrackingMap";
import GPSZoneManager from "../components/gps/GPSZoneManager";
import TechnicianHistory from "../components/gps/TechnicianHistory";
import GeofenceAlerts from "../components/gps/GeofenceAlerts";

export default function GPSTracking() {
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  // NEW: Use our custom hooks
  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000 });
  const technicians = techniciansData?.data || [];

  const { data: gpsZonesData } = useGpsZoness({ page: 1, limit: 1000 });
  const gpsZones = gpsZonesData?.data || [];

  // GPS tracking with auto-refresh every 30 seconds
  const { data: trackingDataResponse } = useGpsTrackings(
    { page: 1, limit: 100 },
    { refetchInterval: 30000 }
  );
  const trackingData = trackingDataResponse?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  // Transform data to match component expectations (snake_case)
  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    user_id: tech.userId,
    is_active: tech.isActive,
    phone_number: tech.phoneNumber,
    first_name: tech.name?.split(' ')[0] || tech.name || '',
    last_name: tech.name?.split(' ').slice(1).join(' ') || '',
  }));

  const transformedGpsZones = gpsZones.map(zone => ({
    ...zone,
    is_active: zone.isActive,
    created_by: zone.createdBy,
  }));

  const transformedTrackingData = trackingData.map(tracking => ({
    ...tracking,
    technician_id: tracking.technicianId,
    technician_name: tracking.technicianName,
    activity_type: tracking.activityType,
  }));

  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
  }));

  // Get latest position for each technician
  const latestPositions = transformedTechnicians.map(tech => {
    const techTracking = transformedTrackingData.filter(t => t.technician_id === tech.id);
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
              <p className="text-2xl font-bold text-blue-600">{transformedGpsZones.length}</p>
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
              <p className="text-2xl font-bold text-purple-600">{transformedTrackingData.length}</p>
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
            zones={transformedGpsZones}
            onTechnicianClick={setSelectedTechnician}
          />
        </TabsContent>

        <TabsContent value="zones" className="mt-6">
          <GPSZoneManager zones={transformedGpsZones} jobs={transformedJobs} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <TechnicianHistory
            technicians={transformedTechnicians}
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

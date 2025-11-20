import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2, MapPin, AlertCircle } from "lucide-react";
import { differenceInMinutes } from "date-fns";

export default function QuickPunchCard({ technician, activeEntry, currentPosition }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: gpsZones = [] } = useQuery({
    queryKey: ['gpsZones'],
    queryFn: () => base44.entities.GPSZone.list(),
  });

  const checkGPSZone = (position) => {
    if (!position) return { inZone: false, zone: null };
    
    for (const zone of gpsZones.filter(z => z.active)) {
      const distance = getDistance(
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

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handlePunchIn = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!currentPosition) {
        throw new Error('Position GPS non disponible');
      }

      const { inZone, zone } = checkGPSZone(currentPosition);

      if (!technician.gps_punch_outside_zone && !inZone) {
        throw new Error('Vous devez être dans une zone GPS autorisée');
      }

      await base44.entities.TimeEntry.create({
        technician_id: technician.id,
        technician_name: `${technician.first_name} ${technician.last_name}`,
        clock_in: new Date().toISOString(),
        status: "in_progress",
        location_in: inZone ? zone.name : "Hors zone",
        gps_verified: inZone,
      });

      await base44.entities.GPSTracking.create({
        technician_id: technician.id,
        technician_name: `${technician.first_name} ${technician.last_name}`,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        accuracy: currentPosition.accuracy,
        timestamp: new Date().toISOString(),
        activity_type: "punch_in",
      });

      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!confirm('Confirmer le poinçon de sortie?')) return;

    setLoading(true);
    setError(null);

    try {
      const clockOut = new Date().toISOString();
      const totalMinutes = differenceInMinutes(new Date(clockOut), new Date(activeEntry.clock_in));
      const totalHours = ((totalMinutes - (activeEntry.break_minutes || 0)) / 60).toFixed(2);

      await base44.entities.TimeEntry.update(activeEntry.id, {
        clock_out: clockOut,
        total_hours: parseFloat(totalHours),
        status: "completed",
        location_out: currentPosition ? "GPS enregistré" : "Sans GPS",
      });

      if (currentPosition) {
        await base44.entities.GPSTracking.create({
          technician_id: technician.id,
          technician_name: `${technician.first_name} ${technician.last_name}`,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          accuracy: currentPosition.accuracy,
          timestamp: clockOut,
          activity_type: "punch_out",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { inZone, zone } = checkGPSZone(currentPosition);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Pointage rapide</h3>
      
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {currentPosition && (
        <div className="mb-3 text-xs text-slate-600 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {inZone ? (
            <span className="text-green-600">✓ Dans la zone: {zone.name}</span>
          ) : (
            <span className="text-orange-600">Hors zone GPS</span>
          )}
        </div>
      )}

      {activeEntry ? (
        <Button 
          onClick={handlePunchOut}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 mr-2" />
          )}
          Poinçon Sortie
        </Button>
      ) : (
        <Button 
          onClick={handlePunchIn}
          disabled={loading || !currentPosition}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <LogIn className="w-5 h-5 mr-2" />
          )}
          Poinçon Entrée
        </Button>
      )}
    </Card>
  );
}
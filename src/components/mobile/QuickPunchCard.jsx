import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle, Clock, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/shared/translations";

export default function QuickPunchCard({ technician, activeTimeEntry, lang = 'fr', isOnline }) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [gettingLocation, setGettingLocation] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslation(lang);

  // Update elapsed time every second
  useEffect(() => {
    if (!activeTimeEntry) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateTime = () => {
      const start = new Date(activeTimeEntry.clock_in);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  const clockInMutation = useMutation({
    mutationFn: async () => {
      let location = null;
      
      if (navigator.geolocation) {
        setGettingLocation(true);
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          location = `${position.coords.latitude},${position.coords.longitude}`;
        } catch (error) {
          console.error('[QuickPunch] GPS error:', error);
        } finally {
          setGettingLocation(false);
        }
      }

      return base44.entities.TimeEntry.create({
        technician_id: technician.id,
        technician_name: `${technician.first_name} ${technician.last_name}`,
        clock_in: new Date().toISOString(),
        location_in: location,
        gps_verified: !!location,
        status: 'in_progress'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimeEntry'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      let location = null;
      
      if (navigator.geolocation) {
        setGettingLocation(true);
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          location = `${position.coords.latitude},${position.coords.longitude}`;
        } catch (error) {
          console.error('[QuickPunch] GPS error:', error);
        } finally {
          setGettingLocation(false);
        }
      }

      const clockIn = new Date(activeTimeEntry.clock_in);
      const clockOut = new Date();
      const totalHours = (clockOut - clockIn) / (1000 * 60 * 60);

      return base44.entities.TimeEntry.update(activeTimeEntry.id, {
        clock_out: clockOut.toISOString(),
        location_out: location,
        total_hours: totalHours,
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimeEntry'] });
    },
  });

  if (!technician) return null;

  return (
    <Card className="shadow-lg border-2 border-blue-200">
      <CardContent className="p-4">
        {activeTimeEntry ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">
                {lang === 'fr' ? 'Temps écoulé' : 'Elapsed Time'}
              </p>
              <p className="text-4xl font-bold text-blue-600 font-mono">
                {elapsedTime}
              </p>
            </div>

            <Button
              onClick={() => clockOutMutation.mutate()}
              disabled={!isOnline || gettingLocation || clockOutMutation.isPending}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg font-semibold"
            >
              <StopCircle className="w-6 h-6 mr-2" />
              {gettingLocation 
                ? (lang === 'fr' ? 'Localisation...' : 'Locating...') 
                : (lang === 'fr' ? 'Pointer Sortie' : 'Clock Out')}
            </Button>

            {activeTimeEntry.location_in && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{lang === 'fr' ? 'Démarré avec GPS' : 'Started with GPS'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-600">
                {lang === 'fr' ? 'Pas de temps actif' : 'No active time'}
              </p>
            </div>

            <Button
              onClick={() => clockInMutation.mutate()}
              disabled={!isOnline || gettingLocation || clockInMutation.isPending}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg font-semibold"
            >
              <PlayCircle className="w-6 h-6 mr-2" />
              {gettingLocation 
                ? (lang === 'fr' ? 'Localisation...' : 'Locating...') 
                : (lang === 'fr' ? 'Pointer Entrée' : 'Clock In')}
            </Button>
          </div>
        )}

        {!isOnline && (
          <p className="text-xs text-orange-600 text-center mt-2">
            {lang === 'fr' ? 'Connexion requise' : 'Connection required'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Briefcase, Battery, Navigation, LogIn, LogOut } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import MobileJobCard from "../components/mobile/MobileJobCard";
import QuickPunchCard from "../components/mobile/QuickPunchCard";
import GPSStatusCard from "../components/mobile/GPSStatusCard";
import OfflineIndicator from "../components/mobile/OfflineIndicator";
import OfflineStorage from "../components/mobile/OfflineStorage";
import syncManager from "../components/mobile/SyncManager";

export default function TechnicianMobile() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('inactive');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const currentTech = technicians.find(t => t.email === currentUser?.email);

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      if (!isOnline) {
        return OfflineStorage.getTimeEntries();
      }
      const entries = await base44.entities.TimeEntry.list('-clock_in', 10);
      OfflineStorage.saveTimeEntries(entries);
      return entries;
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      if (!isOnline) {
        return OfflineStorage.getJobs();
      }
      const fetchedJobs = await base44.entities.Job.list();
      OfflineStorage.saveJobs(fetchedJobs);
      return fetchedJobs;
    },
  });

  const activeEntry = timeEntries.find(
    e => e.technician_id === currentTech?.id && e.status === 'in_progress'
  );

  const myJobs = jobs.filter(
    j => j.technician_id === currentTech?.id && 
    (j.status === 'scheduled' || j.status === 'in_progress')
  );

  // Online/Offline status management
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncManager.syncPendingOperations();
      syncManager.refreshData(currentUser);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync status updates
    syncManager.onSyncStatusChange((status, pending) => {
      setSyncStatus(status);
      setPendingCount(pending);
    });

    // Check for pending operations on mount
    setPendingCount(OfflineStorage.getPendingSync().length);

    // Initial sync if online
    if (navigator.onLine) {
      syncManager.syncPendingOperations();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  // GPS Background tracking with battery optimization
  useEffect(() => {
    if (!currentTech || !activeEntry) return;

    let watchId;
    let trackingInterval;

    const startGPSTracking = () => {
      if (!navigator.geolocation) {
        setGpsStatus('unavailable');
        return;
      }

      setGpsStatus('active');

      // High accuracy for first position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updatePosition(position);
        },
        (error) => {
          setGpsStatus('error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Background tracking with battery-friendly settings
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          updatePosition(position);
        },
        (error) => {
          console.error('GPS Error:', error);
          setGpsStatus('error');
        },
        {
          enableHighAccuracy: false, // Save battery
          timeout: 30000,
          maximumAge: 60000, // Accept 1-minute old positions
        }
      );

      // Update position every 5 minutes for active jobs
      trackingInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updatePosition(position, true);
          },
          null,
          { enableHighAccuracy: false, maximumAge: 60000 }
        );
      }, 300000); // 5 minutes
    };

    const updatePosition = (position, saveToServer = false) => {
      const pos = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
      };

      setCurrentPosition(pos);

      // Save GPS data (online or offline)
      if (saveToServer || pos.speed > 1) {
        const gpsData = {
          technician_id: currentTech.id,
          technician_name: `${currentTech.first_name} ${currentTech.last_name}`,
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
          speed: pos.speed * 3.6, // Convert m/s to km/h
          heading: pos.heading,
          timestamp: new Date().toISOString(),
          activity_type: 'location_update',
          job_id: activeEntry?.job_id,
        };

        if (navigator.onLine) {
          base44.entities.GPSTracking.create(gpsData).catch(err => {
            console.error('GPS tracking error:', err);
            OfflineStorage.saveGPSTracking(gpsData);
          });
        } else {
          OfflineStorage.saveGPSTracking(gpsData);
        }
      }
    };

    // Check battery level
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    startGPSTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (trackingInterval) clearInterval(trackingInterval);
    };
  }, [currentTech, activeEntry]);

  if (!currentTech) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <p className="text-slate-600">Aucun profil technicien trouvé pour votre compte</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentTech.avatar_url ? (
              <img src={currentTech.avatar_url} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: currentTech.color || '#64748b' }}
              >
                {currentTech.first_name[0]}{currentTech.last_name[0]}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{currentTech.first_name}</p>
              <p className="text-xs text-slate-500">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Battery className={`w-4 h-4 ${batteryLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
              {batteryLevel}%
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Offline Indicator */}
        <OfflineIndicator syncStatus={syncStatus} pendingCount={pendingCount} />

        {/* GPS Status */}
        <GPSStatusCard status={gpsStatus} position={currentPosition} />

        {/* Quick Punch */}
        <QuickPunchCard 
          technician={currentTech}
          activeEntry={activeEntry}
          currentPosition={currentPosition}
          isOnline={isOnline}
        />

        {/* Active Time */}
        {activeEntry && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Temps actif</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Math.floor(differenceInMinutes(new Date(), new Date(activeEntry.clock_in)) / 60)}h
                    {differenceInMinutes(new Date(), new Date(activeEntry.clock_in)) % 60}m
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>Début: {format(new Date(activeEntry.clock_in), 'HH:mm')}</p>
                {activeEntry.location_in && (
                  <p className="text-xs flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3" />
                    {activeEntry.location_in}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* My Jobs Today */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Mes Jobs ({myJobs.length})
            </h2>
          </div>
          
          {myJobs.length > 0 ? (
            <div className="space-y-3">
              {myJobs.map(job => (
                <MobileJobCard 
                  key={job.id} 
                  job={job} 
                  currentPosition={currentPosition}
                  isOnline={isOnline}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Aucun job assigné aujourd'hui</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
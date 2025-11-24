import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  PlayCircle,
  WifiOff,
  Wifi,
  Battery,
  RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MobileJobCard from "@/components/mobile/MobileJobCard";
import QuickPunchCard from "@/components/mobile/QuickPunchCard";
import OfflineManager from "@/components/mobile/OfflineManager";
import { useTranslation } from "@/components/shared/translations";
import { JOB_STATUS, TIME_ENTRY_STATUS } from "@/constants/statuses";

export default function TechnicianMobile() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: languageSettings } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.LanguageSettings.list();
      return settings[0] || { language: 'fr' };
    },
  });

  const lang = languageSettings?.language || 'fr';
  const t = useTranslation(lang);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technician } = useQuery({
    queryKey: ['currentTechnician', currentUser?.email],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter({ email: currentUser?.email });
      return techs[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ['myJobs', technician?.id],
    queryFn: async () => {
      if (!technician?.id) return [];
      const allJobs = await base44.entities.Job.list();
      return allJobs.filter(job =>
        job.technicians?.some(t => t.id === technician.id) &&
        job.status !== JOB_STATUS.COMPLETED &&
        job.status !== JOB_STATUS.CANCELLED
      ).sort((a, b) => {
        if (a.status === JOB_STATUS.IN_PROGRESS) return -1;
        if (b.status === JOB_STATUS.IN_PROGRESS) return 1;
        return new Date(a.due_date || a.created_date) - new Date(b.due_date || b.created_date);
      });
    },
    enabled: !!technician,
    refetchInterval: isOnline ? 30000 : false,
  });

  const { data: activeTimeEntry } = useQuery({
    queryKey: ['activeTimeEntry', technician?.id],
    queryFn: async () => {
      if (!technician?.id) return null;
      const entries = await base44.entities.TimeEntry.filter({
        technician_id: technician.id,
        status: TIME_ENTRY_STATUS.ACTIVE
      });
      return entries[0] || null;
    },
    enabled: !!technician,
    refetchInterval: 10000,
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery level
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Sync offline data when coming back online
  const syncOfflineData = async () => {
    const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    if (offlineQueue.length === 0) return;

    setSyncing(true);
    try {
      for (const item of offlineQueue) {
        if (item.type === 'job_status') {
          await base44.entities.Job.update(item.jobId, { status: item.status });
        } else if (item.type === 'photo_upload') {
          await base44.entities.Job.update(item.jobId, {
            attachments: [...(item.existingAttachments || []), item.attachment]
          });
        }
      }
      localStorage.setItem('offline_queue', '[]');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    } catch (error) {
      console.error('[TechnicianMobile] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return 'text-green-600';
    if (batteryLevel > 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const inProgressJobs = myJobs.filter(j => j.status === JOB_STATUS.IN_PROGRESS);
  const scheduledJobs = myJobs.filter(j => j.status === JOB_STATUS.SCHEDULED);
  const otherJobs = myJobs.filter(j => j.status !== JOB_STATUS.IN_PROGRESS && j.status !== JOB_STATUS.SCHEDULED);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      {/* Fixed Header - Optimized for mobile */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {technician?.first_name?.[0] || 'T'}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {technician?.first_name} {technician?.last_name}
                </h1>
                <p className="text-xs text-slate-500">
                  {inProgressJobs.length} {lang === 'fr' ? 'en cours' : 'in progress'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Battery indicator */}
              <div className={`flex items-center gap-1 ${getBatteryColor()}`}>
                <Battery className="w-4 h-4" />
                <span className="text-xs font-semibold">{batteryLevel}%</span>
              </div>

              {/* Online/Offline indicator */}
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}

              {/* Sync button */}
              {!isOnline && (
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled
                  className="h-8"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}

              {isOnline && syncing && (
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled
                  className="h-8"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Time Entry Banner */}
          {activeTimeEntry && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-900">
                    {lang === 'fr' ? 'Temps actif' : 'Active Time'}
                  </span>
                </div>
                <span className="text-sm font-bold text-green-900">
                  {new Date(activeTimeEntry.clock_in).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
          <WifiOff className="w-4 h-4 inline mr-2" />
          {lang === 'fr' ? 'Mode hors ligne - Les modifications seront synchronisées' : 'Offline mode - Changes will sync later'}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Punch Card */}
        <QuickPunchCard 
          technician={technician} 
          activeTimeEntry={activeTimeEntry}
          lang={lang}
          isOnline={isOnline}
        />

        {/* Jobs in Progress */}
        {inProgressJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              {lang === 'fr' ? 'En cours' : 'In Progress'} ({inProgressJobs.length})
            </h2>
            <div className="space-y-3">
              {inProgressJobs.map(job => (
                <MobileJobCard 
                  key={job.id} 
                  job={job} 
                  technician={technician}
                  lang={lang}
                  isOnline={isOnline}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Jobs */}
        {scheduledJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              {lang === 'fr' ? 'Planifiés' : 'Scheduled'} ({scheduledJobs.length})
            </h2>
            <div className="space-y-3">
              {scheduledJobs.map(job => (
                <MobileJobCard 
                  key={job.id} 
                  job={job} 
                  technician={technician}
                  lang={lang}
                  isOnline={isOnline}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Jobs */}
        {otherJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-slate-600" />
              {lang === 'fr' ? 'Autres' : 'Other'} ({otherJobs.length})
            </h2>
            <div className="space-y-3">
              {otherJobs.map(job => (
                <MobileJobCard 
                  key={job.id} 
                  job={job} 
                  technician={technician}
                  lang={lang}
                  isOnline={isOnline}
                />
              ))}
            </div>
          </div>
        )}

        {myJobs.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {lang === 'fr' ? 'Aucun job assigné' : 'No assigned jobs'}
              </h3>
              <p className="text-slate-500">
                {lang === 'fr' ? 'Profitez de votre temps libre!' : 'Enjoy your free time!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Offline Manager */}
      <OfflineManager isOnline={isOnline} onSync={syncOfflineData} lang={lang} />
    </div>
  );
}
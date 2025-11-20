import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, Upload } from "lucide-react";

const STORAGE_KEY = 'offline_sync_queue';

export default function OfflineSyncQueue({ isOnline }) {
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setQueue(stored ? JSON.parse(stored) : []);
    } catch (err) {
      setQueue([]);
    }
  };

  const syncQueue = async () => {
    if (!isOnline || queue.length === 0) return;

    setSyncing(true);
    const failed = [];

    for (const item of queue) {
      try {
        switch (item.action) {
          case 'update_job':
            await base44.entities.Job.update(item.entityId, item.data);
            break;
          case 'update_service_call':
            await base44.entities.ServiceCall.update(item.entityId, item.data);
            break;
          case 'create_time_entry':
            await base44.entities.TimeEntry.create(item.data);
            break;
          default:
            console.warn('Unknown action:', item.action);
        }
      } catch (err) {
        failed.push({ ...item, error: err.message });
      }
    }

    if (failed.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      setQueue([]);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failed));
      setQueue(failed);
    }

    setSyncing(false);
  };

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline]);

  if (queue.length === 0) return null;

  return (
    <Card className="border-orange-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-semibold text-sm">Pending Sync</p>
              <p className="text-xs text-slate-600">{queue.length} changes waiting</p>
            </div>
          </div>
          
          {isOnline ? (
            <Button
              size="sm"
              onClick={syncQueue}
              disabled={syncing}
              className="bg-green-600 hover:bg-green-700"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              <AlertCircle className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, RefreshCw, CheckCircle } from "lucide-react";

export default function OfflineIndicator({ syncStatus, pendingCount }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && syncStatus === 'synced' && pendingCount === 0) {
    return null;
  }

  return (
    <Card className={`p-3 ${!isOnline ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900 text-sm">Mode hors ligne</p>
                <p className="text-xs text-orange-700">
                  {pendingCount > 0 ? `${pendingCount} modification(s) en attente` : 'Données sauvegardées localement'}
                </p>
              </div>
            </>
          ) : (
            <>
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Synchronisation...</p>
                    <p className="text-xs text-blue-700">{pendingCount} élément(s) restant(s)</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Synchronisé</p>
                    <p className="text-xs text-green-700">Toutes les données sont à jour</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {isOnline && pendingCount > 0 && (
          <Badge variant="outline" className="bg-white">
            <Wifi className="w-3 h-3 mr-1" />
            En ligne
          </Badge>
        )}
      </div>
    </Card>
  );
}
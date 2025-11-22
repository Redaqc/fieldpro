import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, CheckCircle, AlertCircle, Database } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OfflineStorage from "./OfflineStorage";

export default function OfflineIndicator({ syncStatus, pendingCount, onRetrySync }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expanded, setExpanded] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update last sync time
    const syncTime = OfflineStorage.getLastSync();
    if (syncTime) {
      setLastSync(new Date(syncTime));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);

  if (isOnline && syncStatus === 'synced' && pendingCount === 0) {
    return null;
  }

  return (
    <Card className={`p-3 ${
      !isOnline ? 'bg-orange-50 border-orange-200' : 
      syncStatus === 'error' ? 'bg-red-50 border-red-200' :
      syncStatus === 'syncing' ? 'bg-blue-50 border-blue-200' :
      'bg-green-50 border-green-200'
    }`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {!isOnline ? (
              <>
                <WifiOff className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 text-sm">Mode hors ligne</p>
                  <p className="text-xs text-orange-700">
                    {pendingCount > 0 ? `${pendingCount} modification(s) en attente` : 'Données sauvegardées localement'}
                  </p>
                </div>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 text-sm">Erreur de synchronisation</p>
                  <p className="text-xs text-red-700">{pendingCount} opération(s) échouée(s)</p>
                </div>
                {onRetrySync && (
                  <Button 
                    size="sm" 
                    onClick={onRetrySync}
                    className="bg-red-600 hover:bg-red-700 h-7 text-xs"
                  >
                    Réessayer
                  </Button>
                )}
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 text-sm">Synchronisation...</p>
                  <p className="text-xs text-blue-700">{pendingCount} élément(s) restant(s)</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 text-sm">Synchronisé</p>
                  <p className="text-xs text-green-700">
                    {lastSync ? `Dernière sync: ${format(lastSync, 'HH:mm', { locale: fr })}` : 'À jour'}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {(isOnline && pendingCount > 0) || expanded ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2"
            >
              {expanded ? '▲' : '▼'}
            </Button>
          ) : null}
        </div>

        {expanded && pendingCount > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Database className="w-4 h-4" />
              <span>{pendingCount} opération(s) en attente de synchronisation</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Les modifications seront automatiquement synchronisées dès que la connexion sera rétablie.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
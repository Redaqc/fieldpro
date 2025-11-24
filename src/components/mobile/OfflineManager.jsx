import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Check, Clock } from "lucide-react";
import { useTranslation } from "@/components/shared/translations";

export default function OfflineManager({ isOnline, onSync, lang = 'fr' }) {
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const t = useTranslation(lang);

  useEffect(() => {
    const updateCount = () => {
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      setQueueCount(queue.length);
    };

    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  if (queueCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Card className="shadow-2xl border-2 border-blue-500 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {queueCount} {lang === 'fr' ? 'action(s) en attente' : 'pending action(s)'}
                </p>
                <p className="text-xs text-slate-500">
                  {isOnline 
                    ? (lang === 'fr' ? 'Prêt à synchroniser' : 'Ready to sync')
                    : (lang === 'fr' ? 'Hors ligne' : 'Offline')}
                </p>
              </div>
            </div>

            {isOnline && (
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="h-10 bg-blue-600 hover:bg-blue-700"
              >
                {syncing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {lang === 'fr' ? 'Sync' : 'Sync'}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
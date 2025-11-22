import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function OfflineQueueManager() {
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadQueue = () => {
    const stored = localStorage.getItem('offline_queue');
    if (stored) {
      setQueue(JSON.parse(stored));
    }
  };

  const handleOnline = () => {
    if (queue.length > 0) {
      syncQueue();
    }
  };

  const syncQueue = async () => {
    if (syncing || queue.length === 0) return;

    setSyncing(true);
    const updatedQueue = [...queue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      
      try {
        switch (item.operation) {
          case 'create':
            await base44.entities[item.entity].create(item.data);
            break;
          case 'update':
            await base44.entities[item.entity].update(item.id, item.data);
            break;
          case 'delete':
            await base44.entities[item.entity].delete(item.id);
            break;
        }
        
        updatedQueue[i].status = 'synced';
      } catch (error) {
        updatedQueue[i].status = 'failed';
        updatedQueue[i].error = error.message;
      }
    }

    const remaining = updatedQueue.filter(item => item.status !== 'synced');
    setQueue(remaining);
    localStorage.setItem('offline_queue', JSON.stringify(remaining));
    setSyncing(false);
  };

  const clearSynced = () => {
    const remaining = queue.filter(item => item.status !== 'synced');
    setQueue(remaining);
    localStorage.setItem('offline_queue', JSON.stringify(remaining));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (queue.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Offline Queue</CardTitle>
          <Button
            size="sm"
            onClick={syncQueue}
            disabled={syncing}
            variant="outline"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {queue.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div className="flex items-center gap-2">
              {getStatusIcon(item.status)}
              <div>
                <p className="text-sm font-medium">
                  {item.operation} {item.entity}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <Badge variant={item.status === 'failed' ? 'destructive' : 'secondary'}>
              {item.status}
            </Badge>
          </div>
        ))}
        
        {queue.some(item => item.status === 'synced') && (
          <Button size="sm" variant="ghost" onClick={clearSynced} className="w-full">
            Clear Synced Items
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
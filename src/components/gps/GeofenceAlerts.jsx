import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function GeofenceAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['gpsAlerts'],
    queryFn: () => base44.entities.GPSAlert.list('-timestamp', 50),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.GPSAlert.update(id, {
      acknowledged: true,
      acknowledged_by: 'admin',
      acknowledged_at: new Date().toISOString(),
      notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsAlerts'] });
    },
  });

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const recentAlerts = alerts.slice(0, 20);

  const alertConfig = {
    zone_entry: {
      icon: <LogIn className="w-4 h-4" />,
      label: 'Entrée zone',
      color: 'bg-green-100 text-green-800',
    },
    zone_exit: {
      icon: <LogOut className="w-4 h-4" />,
      label: 'Sortie zone',
      color: 'bg-red-100 text-red-800',
    },
    long_stay: {
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'Séjour prolongé',
      color: 'bg-orange-100 text-orange-800',
    },
    unexpected_movement: {
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'Mouvement inattendu',
      color: 'bg-yellow-100 text-yellow-800',
    },
  };

  return (
    <div className="space-y-4">
      {unacknowledgedAlerts.length > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">
              Alertes non traitées ({unacknowledgedAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {unacknowledgedAlerts.slice(0, 5).map(alert => {
              const config = alertConfig[alert.alert_type] || alertConfig.zone_entry;
              return (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <p className="font-medium">{alert.technician_name}</p>
                      <p className="text-sm text-slate-600">
                        {config.label} - {alert.zone_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(alert.timestamp), 'PPp', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => acknowledgeMutation.mutate({ id: alert.id, notes: '' })}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Traiter
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Historique des alertes</h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>Aucune alerte enregistrée</p>
            </div>
          ) : (
            recentAlerts.map(alert => {
              const config = alertConfig[alert.alert_type] || alertConfig.zone_entry;
              return (
                <div 
                  key={alert.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.acknowledged ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.technician_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Traité
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{alert.zone_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(alert.timestamp), 'PPp', { locale: fr })}
                      </p>
                      {alert.notes && (
                        <p className="text-xs text-slate-600 mt-1 italic">Note: {alert.notes}</p>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeMutation.mutate({ id: alert.id, notes: '' })}
                    >
                      Traiter
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
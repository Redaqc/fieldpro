import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AlertManagement({ currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const queryClient = useQueryClient();

  const { data: allNotifications = [] } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 200),
  });

  const { data: gpsAlerts = [] } = useQuery({
    queryKey: ['gpsAlerts'],
    queryFn: () => base44.entities.GPSAlert.list('-timestamp', 100),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, {
      read: true,
      read_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.GPSAlert.update(id, {
      acknowledged: true,
      acknowledged_by: currentUser?.email,
      acknowledged_at: new Date().toISOString(),
      notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsAlerts'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    },
  });

  const filteredNotifications = allNotifications.filter(n => {
    const searchMatch = !searchTerm || 
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === 'all' || n.type === filterType;
    const priorityMatch = filterPriority === 'all' || n.priority === filterPriority;
    return searchMatch && typeMatch && priorityMatch;
  });

  const unacknowledgedAlerts = gpsAlerts.filter(a => !a.acknowledged);

  const stats = {
    total: allNotifications.length,
    unread: allNotifications.filter(n => !n.read).length,
    urgent: allNotifications.filter(n => n.priority === 'urgent').length,
    gpsAlerts: unacknowledgedAlerts.length,
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Notifications totales</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Non lues</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Urgentes</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Alertes GPS</p>
              <p className="text-2xl font-bold text-purple-600">{stats.gpsAlerts}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* GPS Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-900">
            <AlertTriangle className="w-5 h-5" />
            Alertes GPS non traitées ({unacknowledgedAlerts.length})
          </h3>
          <div className="space-y-2">
            {unacknowledgedAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{alert.technician_name}</p>
                  <p className="text-sm text-slate-600">
                    {alert.alert_type === 'zone_entry' ? 'Entrée dans' : 'Sortie de'} la zone "{alert.zone_name}"
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(alert.timestamp), 'PPp', { locale: fr })}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const notes = prompt('Notes (optionnel):');
                    acknowledgeAlertMutation.mutate({ id: alert.id, notes: notes || '' });
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Traiter
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher dans les notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="job_assigned">Job assigné</SelectItem>
              <SelectItem value="job_status_changed">Statut changé</SelectItem>
              <SelectItem value="gps_alert">Alerte GPS</SelectItem>
              <SelectItem value="time_entry">Pointage</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="normal">Normale</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Notifications List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Toutes les notifications ({filteredNotifications.length})
        </h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    <Badge className={priorityColors[notification.priority]}>
                      {notification.priority}
                    </Badge>
                    {!notification.read && (
                      <Badge variant="default">Non lu</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{format(new Date(notification.created_date), 'PPp', { locale: fr })}</span>
                    <span>•</span>
                    <span>Type: {notification.type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                    >
                      Marquer lu
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Supprimer cette notification?')) {
                        deleteNotificationMutation.mutate(notification.id);
                      }
                    }}
                    className="text-red-600"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
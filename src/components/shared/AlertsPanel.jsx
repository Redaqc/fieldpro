import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Package, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function AlertsPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-created_date', 50);
      return allAlerts.filter(a => a.status === 'active');
    },
    refetchInterval: 60000, // Refresh every minute
    initialData: [],
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      const user = await base44.auth.me();
      return base44.entities.Alert.update(alertId, {
        status: 'acknowledged',
        acknowledged_by: user.email,
        acknowledged_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, {
      status: 'resolved',
      resolved_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'low_stock': return Package;
      case 'technician_late': return Clock;
      default: return AlertTriangle;
    }
  };

  const handleAlertClick = (alert) => {
    if (alert.entity_type && alert.entity_id) {
      const pageMap = {
        'Job': 'Jobs',
        'ServiceCall': 'ServiceCalls',
        'Material': 'Materials',
        'Invoice': 'Invoices'
      };
      const page = pageMap[alert.entity_type];
      if (page) {
        navigate(createPageUrl(page) + `?id=${alert.entity_id}`);
      }
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Active Alerts
          </CardTitle>
          <div className="flex gap-2">
            {criticalAlerts > 0 && (
              <Badge className="bg-red-500">{criticalAlerts} Critical</Badge>
            )}
            {highAlerts > 0 && (
              <Badge className="bg-orange-500">{highAlerts} High</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.map(alert => {
          const Icon = getIcon(alert.type);
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
              <Icon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900">{alert.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                <div className="flex gap-2 mt-2">
                  {alert.entity_type && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAlertClick(alert)}
                      className="h-7 text-xs"
                    >
                      View {alert.entity_type}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                    className="h-7 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveAlertMutation.mutate(alert.id)}
                    className="h-7 w-7 p-0 text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
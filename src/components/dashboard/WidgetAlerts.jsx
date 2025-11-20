import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function WidgetAlerts() {
  const navigate = useNavigate();

  const { data: alerts = [] } = useQuery({
    queryKey: ['activeAlerts'],
    queryFn: async () => {
      const all = await base44.entities.Alert.list('-created_date', 20);
      return all.filter(a => a.status === 'active');
    },
    refetchInterval: 30000,
    initialData: [],
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Active Alerts
          </CardTitle>
          <div className="flex gap-1">
            {criticalCount > 0 && <Badge className="bg-red-500">{criticalCount}</Badge>}
            {highCount > 0 && <Badge className="bg-orange-500">{highCount}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No active alerts</p>
        ) : (
          alerts.slice(0, 5).map(alert => (
            <div
              key={alert.id}
              className="text-sm p-3 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100"
              onClick={() => {
                if (alert.entity_type && alert.entity_id) {
                  const pageMap = {
                    'Job': 'Jobs',
                    'ServiceCall': 'ServiceCalls',
                    'Material': 'Materials'
                  };
                  const page = pageMap[alert.entity_type];
                  if (page) navigate(createPageUrl(page) + `?id=${alert.entity_id}`);
                }
              }}
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
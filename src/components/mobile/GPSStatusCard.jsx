import { Card } from "@/components/ui/card";
import { MapPin, AlertCircle, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GPSStatusCard({ status, position }) {
  const statusConfig = {
    active: {
      color: 'bg-green-100 text-green-700 border-green-300',
      icon: <MapPin className="w-4 h-4" />,
      label: 'GPS Actif',
      pulse: true
    },
    inactive: {
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: <MapPin className="w-4 h-4" />,
      label: 'GPS Inactif',
      pulse: false
    },
    error: {
      color: 'bg-red-100 text-red-700 border-red-300',
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'Erreur GPS',
      pulse: false
    },
    unavailable: {
      color: 'bg-orange-100 text-orange-700 border-orange-300',
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'GPS Non disponible',
      pulse: false
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Card className={`p-3 border ${config.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.pulse && (
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )}
          {config.icon}
          <span className="font-semibold text-sm">{config.label}</span>
        </div>
        {position && (
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="outline" className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              ±{position.accuracy?.toFixed(0)}m
            </Badge>
            {position.speed > 0 && (
              <Badge variant="outline">
                {(position.speed * 3.6).toFixed(0)} km/h
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
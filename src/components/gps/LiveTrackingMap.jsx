import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LiveTrackingMap({ technicians, zones, onTechnicianClick }) {
  // Default center (Montreal)
  const defaultCenter = [45.5017, -73.5673];
  const center = technicians.length > 0 
    ? [technicians[0].lastPosition.latitude, technicians[0].lastPosition.longitude]
    : defaultCenter;

  return (
    <Card className="p-4">
      <div className="h-[600px] rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* GPS Zones */}
          {zones.filter(z => z.active).map(zone => (
            <Circle
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
              }}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold">{zone.name}</p>
                  {zone.job_title && (
                    <p className="text-sm text-slate-600">{zone.job_title}</p>
                  )}
                  {zone.address && (
                    <p className="text-xs text-slate-500 mt-1">{zone.address}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Rayon: {zone.radius}m</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Technician Markers */}
          {technicians.map(tech => {
            if (!tech.lastPosition) return null;
            
            const icon = L.divIcon({
              className: "custom-marker",
              html: `
                <div style="
                  background-color: ${tech.color || '#64748b'};
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 14px;
                ">
                  ${tech.first_name[0]}${tech.last_name[0]}
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });

            return (
              <Marker
                key={tech.id}
                position={[tech.lastPosition.latitude, tech.lastPosition.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <p className="font-semibold text-lg">
                      {tech.first_name} {tech.last_name}
                    </p>
                    <div className="space-y-1 mt-2">
                      <Badge className={
                        tech.status === 'available' ? 'bg-green-100 text-green-800' :
                        tech.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {tech.status === 'available' ? 'Disponible' :
                         tech.status === 'busy' ? 'Occupé' : 'Hors service'}
                      </Badge>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Précision: ±{tech.lastPosition.accuracy?.toFixed(0) || 'N/A'}m
                      </p>
                      {tech.lastPosition.speed > 0 && (
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          Vitesse: {tech.lastPosition.speed.toFixed(0)} km/h
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Dernière mise à jour: {format(new Date(tech.lastPosition.timestamp), 'HH:mm:ss', { locale: fr })}
                      </p>
                    </div>
                    <button
                      onClick={() => onTechnicianClick(tech)}
                      className="mt-3 w-full text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                      Voir détails
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </Card>
  );
}
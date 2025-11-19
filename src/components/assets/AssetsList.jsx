import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Edit, Bell, AlertTriangle, Brain } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusColors = {
  available: "bg-green-100 text-green-800",
  in_use: "bg-blue-100 text-blue-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  repair_needed: "bg-red-100 text-red-800",
  retired: "bg-gray-100 text-gray-800"
};

const getServiceNotification = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = differenceInDays(due, today);
  
  if (daysUntilDue < 0) {
    return {
      type: "overdue",
      color: "bg-red-100 border-red-500 text-red-800",
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      text: `En retard de ${Math.abs(daysUntilDue)} jours`
    };
  } else if (daysUntilDue <= 7) {
    return {
      type: "urgent",
      color: "bg-orange-100 border-orange-500 text-orange-800",
      icon: <Bell className="w-4 h-4 text-orange-600 animate-pulse" />,
      text: `Dans ${daysUntilDue} jours`
    };
  } else if (daysUntilDue <= 30) {
    return {
      type: "soon",
      color: "bg-yellow-100 border-yellow-500 text-yellow-800",
      icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
      text: `Dans ${daysUntilDue} jours`
    };
  }
  
  return {
    type: "ok",
    color: "bg-green-100 border-green-500 text-green-800",
    icon: null,
    text: format(due, 'dd/MM/yyyy')
  };
};

export default function AssetsList({ assets, isLoading, onAssetClick, onDelete }) {
  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Aucun équipement trouvé</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">Photo</TableHead>
            <TableHead className="font-semibold">Équipement</TableHead>
            <TableHead className="font-semibold">Assigné à</TableHead>
            <TableHead className="font-semibold">Emplacement</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="font-semibold">Prochain entretien</TableHead>
            <TableHead className="font-semibold">Notification</TableHead>
            <TableHead className="font-semibold">Risque IA</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const notification = getServiceNotification(asset.due_service_date);
            
            return (
              <TableRow 
                key={asset.id} 
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => onAssetClick(asset)}
              >
                <TableCell>
                  {asset.photos && asset.photos.length > 0 ? (
                    <img 
                      src={asset.photos[0]} 
                      alt={asset.name} 
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-slate-400 text-xs">N/A</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{asset.name}</p>
                    {asset.brand && asset.model && (
                      <p className="text-xs text-slate-500">{asset.brand} - {asset.model}</p>
                    )}
                    {asset.serial_number && (
                      <p className="text-xs text-slate-400">S/N: {asset.serial_number}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {asset.assigned_to_name ? (
                    <span className="text-slate-700">{asset.assigned_to_name}</span>
                  ) : (
                    <span className="text-slate-400 italic">Non assigné</span>
                  )}
                </TableCell>
                <TableCell>
                  {asset.location ? (
                    <span className="text-slate-700">{asset.location}</span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[asset.status || 'available']}>
                    {asset.status === 'available' && 'Disponible'}
                    {asset.status === 'in_use' && 'En utilisation'}
                    {asset.status === 'maintenance' && 'Maintenance'}
                    {asset.status === 'repair_needed' && 'Réparation'}
                    {asset.status === 'retired' && 'Retiré'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {asset.due_service_date ? (
                    <span className="text-slate-700">
                      {format(new Date(asset.due_service_date), 'dd/MM/yyyy')}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {notification && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border-2 ${notification.color}`}>
                      {notification.icon}
                      <span className="text-xs font-medium">{notification.text}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {asset.failure_risk_score > 0 && (
                    <div className="flex items-center gap-2">
                      <Brain className={`w-4 h-4 ${
                        asset.failure_risk_score > 70 ? 'text-red-600' :
                        asset.failure_risk_score > 40 ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                      <span className={`text-sm font-semibold ${
                        asset.failure_risk_score > 70 ? 'text-red-700' :
                        asset.failure_risk_score > 40 ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {asset.failure_risk_score}%
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssetClick(asset);
                      }}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer cet équipement?')) onDelete(asset.id);
                      }}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const statusColors = {
  active: "bg-green-100 text-green-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  repair_needed: "bg-red-100 text-red-800",
  retired: "bg-gray-100 text-gray-800"
};

export default function AssetsList({ assets, isLoading, onAssetClick, onDelete }) {
  if (assets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No assets found</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="p-6 hover:shadow-md transition-all border-slate-200">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => onAssetClick(asset)}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-900">{asset.name}</h3>
                </div>
                <Badge className={statusColors[asset.status || 'active']}>
                  {(asset.status || 'active').replace('_', ' ')}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this asset?')) onDelete(asset.id);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium">Customer:</span> {asset.customer_name}</p>
              {asset.brand && <p><span className="font-medium">Brand:</span> {asset.brand}</p>}
              {asset.model && <p><span className="font-medium">Model:</span> {asset.model}</p>}
              {asset.serial_number && (
                <p className="truncate"><span className="font-medium">S/N:</span> {asset.serial_number}</p>
              )}
              {asset.installation_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Installed: {format(new Date(asset.installation_date), 'MMM yyyy')}</span>
                </div>
              )}
              {asset.next_service_date && (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Next service: {format(new Date(asset.next_service_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";

export default function StockAlertWidget({ materials }) {
  const lowStock = materials.filter(m => 
    m.quantity_in_stock <= m.reorder_level && 
    m.status === 'active'
  ).sort((a, b) => a.quantity_in_stock - b.quantity_in_stock);

  const outOfStock = lowStock.filter(m => m.quantity_in_stock === 0);
  const critical = lowStock.filter(m => m.quantity_in_stock > 0 && m.quantity_in_stock <= m.reorder_level / 2);
  const warning = lowStock.filter(m => m.quantity_in_stock > m.reorder_level / 2 && m.quantity_in_stock <= m.reorder_level);

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Alertes Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-900">{outOfStock.length}</p>
            <p className="text-xs text-red-600">Rupture</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-900">{critical.length}</p>
            <p className="text-xs text-orange-600">Critique</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-900">{warning.length}</p>
            <p className="text-xs text-yellow-600">Attention</p>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {lowStock.slice(0, 10).map(material => (
            <div 
              key={material.id} 
              className={`p-3 rounded-lg ${
                material.quantity_in_stock === 0 ? 'bg-red-50' :
                material.quantity_in_stock <= material.reorder_level / 2 ? 'bg-orange-50' : 'bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{material.name}</p>
                  <p className="text-xs text-slate-600">{material.code || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <Badge className={
                    material.quantity_in_stock === 0 ? 'bg-red-600' :
                    material.quantity_in_stock <= material.reorder_level / 2 ? 'bg-orange-600' : 'bg-yellow-600'
                  }>
                    {material.quantity_in_stock} {material.unit}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">Min: {material.reorder_level}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lowStock.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Stock optimal</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
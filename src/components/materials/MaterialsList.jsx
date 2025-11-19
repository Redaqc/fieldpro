import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  discontinued: "bg-red-100 text-red-800"
};

export default function MaterialsList({ materials, isLoading, onMaterialClick, onDelete }) {
  if (materials.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Aucun matériel trouvé</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Code/SKU</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead className="text-right">Prix vente</TableHead>
            <TableHead className="text-right">Prix coûtant</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow
              key={material.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onMaterialClick(material)}
            >
              <TableCell>
                {material.photos && material.photos.length > 0 ? (
                  <img 
                    src={material.photos[0]} 
                    alt={material.name} 
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                    <span className="text-slate-400 text-xs">N/A</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{material.code || '-'}</TableCell>
              <TableCell>{material.name}</TableCell>
              <TableCell>
                {material.supplier ? (
                  <span className="text-slate-700">{material.supplier}</span>
                ) : (
                  <span className="text-slate-400 italic">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold text-green-700">
                ${(material.unit_price || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-600">
                ${(material.cost_price || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {material.quantity_in_stock || 0}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[material.status]}>
                  {material.status === 'active' ? 'Actif' : material.status === 'inactive' ? 'Inactif' : 'Discontinué'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Supprimer ce matériel?')) onDelete(material.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
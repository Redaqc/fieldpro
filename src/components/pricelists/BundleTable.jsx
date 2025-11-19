import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BundleTable({ bundles, onEdit, onDelete }) {
  if (bundles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Aucun bundle trouvé</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">Nom</TableHead>
            <TableHead className="font-semibold">Description</TableHead>
            <TableHead className="font-semibold">Nombre d'items</TableHead>
            <TableHead className="font-semibold text-right">Prix bundle</TableHead>
            <TableHead className="font-semibold text-right">Prix original</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bundles.map((bundle) => (
            <TableRow 
              key={bundle.id} 
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onEdit(bundle)}
            >
              <TableCell className="font-semibold">{bundle.name}</TableCell>
              <TableCell className="text-slate-600">
                {bundle.description || '-'}
              </TableCell>
              <TableCell>{bundle.items?.length || 0} items</TableCell>
              <TableCell className="text-right font-semibold text-green-700">
                ${(bundle.bundle_price || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-slate-500 line-through">
                ${(bundle.original_price || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge className={bundle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {bundle.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(bundle);
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
                      if (confirm('Supprimer ce bundle?')) onDelete(bundle.id);
                    }}
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
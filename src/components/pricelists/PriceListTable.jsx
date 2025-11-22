import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PriceListTable({ priceLists, onEdit, onDelete, onExport }) {
  if (priceLists.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Aucune liste de prix trouvée</p>
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
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {priceLists.map((priceList) => (
            <TableRow 
              key={priceList.id} 
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onEdit(priceList)}
            >
              <TableCell className="font-semibold">{priceList.name}</TableCell>
              <TableCell className="text-slate-600">
                {priceList.description || '-'}
              </TableCell>
              <TableCell>{priceList.items?.length || 0} items</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {priceList.is_default && (
                    <Badge className="bg-blue-100 text-blue-700">Par défaut</Badge>
                  )}
                  <Badge className={priceList.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {priceList.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(priceList);
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
                      onExport(priceList);
                    }}
                    className="h-8 w-8 text-green-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Supprimer cette liste de prix?')) onDelete(priceList.id);
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
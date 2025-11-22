import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package } from "lucide-react";
import { useTranslation } from "@/components/shared/translations";

export default function StockAlertWidget({ materials, lang = 'fr' }) {
  const t = useTranslation(lang);
  const lowStock = materials.filter(m => 
    m.quantity_in_stock <= m.reorder_level && 
    m.status === 'active'
  ).sort((a, b) => a.quantity_in_stock - b.quantity_in_stock);

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800">{t('stockAlert')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>{lang === 'fr' ? 'Code' : 'Code'}</TableHead>
              <TableHead>{lang === 'fr' ? 'Nom' : 'Name'}</TableHead>
              <TableHead>{lang === 'fr' ? 'Quantité' : 'Quantity'}</TableHead>
              <TableHead className="text-right">{lang === 'fr' ? 'Qté Alerte' : 'Alert Qty'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lowStock.slice(0, 10).map((material, idx) => (
              <TableRow key={material.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell className="font-medium">{material.code || 'N/A'}</TableCell>
                <TableCell>
                  <span className="text-blue-600 font-medium">{material.name}</span>
                </TableCell>
                <TableCell>{material.quantity_in_stock} {material.unit}</TableCell>
                <TableCell className="text-right">{material.reorder_level} {material.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {lowStock.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>{t('noStockAlert')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
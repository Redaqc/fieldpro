import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800"
};

export default function QuotationsList({ quotations, isLoading, onQuoteClick, onDelete }) {
  if (quotations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No quotations found</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Nom du Projet</TableHead>
            <TableHead>Date de Début des Travaux</TableHead>
            <TableHead>Date d'Envoi</TableHead>
            <TableHead>Date d'Acceptation</TableHead>
            <TableHead className="text-right">Valeur</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quote) => (
            <TableRow 
              key={quote.id} 
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onQuoteClick(quote)}
            >
              <TableCell className="font-medium">{quote.quote_number}</TableCell>
              <TableCell>{quote.project_name || '-'}</TableCell>
              <TableCell>
                {quote.work_start_date ? format(new Date(quote.work_start_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell>
                {quote.sent_date ? format(new Date(quote.sent_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell>
                {quote.accepted_date ? format(new Date(quote.accepted_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell className="text-right font-semibold">
                ${(quote.total_amount || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[quote.status]}>
                  {quote.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this quotation?')) onDelete(quote.id);
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
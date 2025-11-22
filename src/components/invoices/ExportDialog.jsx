import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { format } from "date-fns";

export default function ExportDialog({ open, onClose, invoices }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const exportToCSV = () => {
    let filtered = invoices;

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(inv => new Date(inv.issue_date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(inv => new Date(inv.issue_date) <= new Date(endDate));
    }

    // Filter by payment status
    if (paymentStatus === "paid") {
      filtered = filtered.filter(inv => inv.status === "paid");
    } else if (paymentStatus === "unpaid") {
      filtered = filtered.filter(inv => inv.status !== "paid" && inv.status !== "cancelled");
    }

    const headers = ['Invoice No.', 'Project Name', 'Client Name', 'Total', 'Balance', 'Due On', 'Created', 'Days Late', 'Status'];
    const csvData = filtered.map(inv => {
      const balance = (inv.total_amount || 0) - (inv.paid_amount || 0);
      const daysLate = inv.due_date && inv.status !== 'paid' 
        ? Math.max(0, Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24)))
        : 0;
      
      return [
        inv.invoice_number || '',
        inv.project_name || '',
        inv.customer_name || '',
        (inv.total_amount || 0).toFixed(2),
        balance.toFixed(2),
        inv.due_date ? format(new Date(inv.due_date), 'yyyy-MM-dd') : '',
        inv.issue_date ? format(new Date(inv.issue_date), 'yyyy-MM-dd') : '',
        daysLate,
        inv.status || ''
      ].join(',');
    });
    
    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter les Factures</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Date de Début</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Date de début"
            />
          </div>

          <div>
            <Label>Date de Fin</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Date de fin"
            />
          </div>

          <div>
            <Label>Statut de Paiement</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="unpaid">Non Payées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
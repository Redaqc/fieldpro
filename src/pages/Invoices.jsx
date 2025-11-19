import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Download, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

import InvoicesList from "../components/invoices/InvoicesList";
import InvoiceDialog from "../components/invoices/InvoiceDialog";
import InvoiceDetails from "../components/invoices/InvoiceDetails";
import InvoiceStats from "../components/invoices/InvoiceStats";
import InvoiceRevenueChart from "../components/invoices/InvoiceRevenueChart";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowDialog(false);
      setSelectedInvoice(null);
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowDialog(false);
      setSelectedInvoice(null);
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedInvoice(null);
    },
  });

  const handleSave = (data) => {
    if (selectedInvoice?.id) {
      updateInvoiceMutation.mutate({ id: selectedInvoice.id, data });
    } else {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      createInvoiceMutation.mutate({ ...data, invoice_number: invoiceNumber });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Numéro",
      "Projet",
      "Client",
      "Date Émission",
      "Date Échéance",
      "Montant Total",
      "Montant Payé",
      "Reste à Payer",
      "Statut",
      "Âge (jours)",
      "Retard (jours)"
    ];

    const csvData = filteredInvoices.map(inv => {
      const age = inv.issue_date ? Math.floor((new Date() - new Date(inv.issue_date)) / (1000 * 60 * 60 * 24)) : 0;
      const overdue = inv.status === 'overdue' && inv.due_date ? Math.max(0, Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24))) : 0;
      const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);

      return [
        inv.invoice_number || '',
        inv.project_name || '',
        inv.customer_name || '',
        inv.issue_date || '',
        inv.due_date || '',
        (inv.total_amount || 0).toFixed(2),
        (inv.paid_amount || 0).toFixed(2),
        remaining.toFixed(2),
        inv.status || '',
        age,
        overdue
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === "" ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    let matchesDateRange = true;
    if (startDate && invoice.issue_date) {
      matchesDateRange = matchesDateRange && new Date(invoice.issue_date) >= new Date(startDate);
    }
    if (endDate && invoice.issue_date) {
      matchesDateRange = matchesDateRange && new Date(invoice.issue_date) <= new Date(endDate);
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Factures</h1>
          <p className="text-slate-500 mt-1">Gérer la facturation et les paiements</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRevenueChart(true)}
            variant="outline"
            className="border-blue-200"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Graphique
          </Button>
          <Button
            onClick={() => {
              setSelectedInvoice(null);
              setShowDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer Facture
          </Button>
        </div>
      </div>

      <InvoiceStats invoices={invoices} onFilterChange={setStatusFilter} />

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Rechercher factures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>

        <div className="flex gap-2">
          <div>
            <Label className="text-xs">Date début</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Date fin</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <Button onClick={exportToCSV} variant="outline" className="h-9">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <InvoicesList
        invoices={filteredInvoices}
        isLoading={isLoading}
        onInvoiceClick={(invoice) => setSelectedInvoice(invoice)}
      />

      {showDialog && (
        <InvoiceDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedInvoice(null);
          }}
          onSave={handleSave}
          invoice={selectedInvoice}
          customers={customers}
          jobs={jobs}
        />
      )}

      {selectedInvoice && !showDialog && (
        <InvoiceDetails
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEdit={() => setShowDialog(true)}
          onUpdate={updateInvoiceMutation.mutate}
          onDelete={() => deleteInvoiceMutation.mutate(selectedInvoice.id)}
        />
      )}

      {showRevenueChart && (
        <InvoiceRevenueChart
          open={showRevenueChart}
          onClose={() => setShowRevenueChart(false)}
          invoices={invoices}
        />
      )}
    </div>
  );
}
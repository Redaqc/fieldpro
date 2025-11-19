import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BarChart3, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";

import InvoicesList from "../components/invoices/InvoicesList";
import InvoiceDialog from "../components/invoices/InvoiceDialog";
import InvoiceDetails from "../components/invoices/InvoiceDetails";
import InvoiceStats from "../components/invoices/InvoiceStats";
import InvoiceChart from "../components/invoices/InvoiceChart";
import ExportDialog from "../components/invoices/ExportDialog";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === "" ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    const matchesDateRange = (!startDate || new Date(invoice.issue_date) >= new Date(startDate)) &&
                             (!endDate || new Date(invoice.issue_date) <= new Date(endDate));

    let matchesAge = true;
    if (ageFilter !== "all" && invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.issue_date) {
      const days = differenceInDays(new Date(), new Date(invoice.issue_date));
      switch(ageFilter) {
        case "unpaid":
          matchesAge = true;
          break;
        case "under30":
          matchesAge = days < 30;
          break;
        case "30to60":
          matchesAge = days >= 30 && days < 60;
          break;
        case "60to90":
          matchesAge = days >= 60 && days < 90;
          break;
        case "over90":
          matchesAge = days >= 90;
          break;
        default:
          matchesAge = true;
      }
    } else if (ageFilter !== "all" && (invoice.status === 'paid' || invoice.status === 'cancelled')) {
      matchesAge = false;
    }

    return matchesSearch && matchesStatus && matchesDateRange && matchesAge;
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
            variant="outline"
            onClick={() => setShowExport(true)}
            className="border-slate-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowChart(true)}
            className="border-slate-200"
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

      <InvoiceStats invoices={invoices} onFilterChange={(filter) => {
        setAgeFilter(filter);
        setStatusFilter("all");
      }} />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Rechercher factures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>

        <Input
          type="date"
          placeholder="Date début"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-48"
        />

        <Input
          type="date"
          placeholder="Date fin"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-48"
        />

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="draft">Brouillon</TabsTrigger>
            <TabsTrigger value="sent">Envoyées</TabsTrigger>
            <TabsTrigger value="paid">Payées</TabsTrigger>
            <TabsTrigger value="overdue">En Retard</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <InvoicesList
        invoices={filteredInvoices}
        isLoading={isLoading}
        onInvoiceClick={(invoice) => setSelectedInvoice(invoice)}
        onDelete={(id) => deleteInvoiceMutation.mutate(id)}
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

      {showChart && (
        <InvoiceChart
          open={showChart}
          onClose={() => setShowChart(false)}
          invoices={invoices}
        />
      )}

      {showExport && (
        <ExportDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          invoices={invoices}
        />
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BarChart3, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";

// NEW: Import our custom hooks
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useJobs } from "@/hooks/useJobs";

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

  // NEW: Use our custom hooks
  const { data: invoicesData, isLoading } = useInvoices({ page: 1, limit: 1000 });
  const invoices = invoicesData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  const handleSave = (data) => {
    if (selectedInvoice?.id) {
      updateInvoiceMutation.mutate(
        { id: selectedInvoice.id, data },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedInvoice(null);
          },
        }
      );
    } else {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      createInvoiceMutation.mutate(
        { ...data, invoiceNumber },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedInvoice(null);
          },
        }
      );
    }
  };

  const handleDelete = (id) => {
    deleteInvoiceMutation.mutate(id, {
      onSuccess: () => {
        setSelectedInvoice(null);
      },
    });
  };

  const handleUpdate = (updateData) => {
    updateInvoiceMutation.mutate(updateData, {
      onSuccess: () => {
        setShowDialog(false);
        setSelectedInvoice(null);
      },
    });
  };

  // Transform data to match component expectations (snake_case)
  const transformedInvoices = invoices.map(invoice => {
    // Find associated customer for customer_name
    const customer = customers.find(c => c.id === invoice.customerId);

    return {
      ...invoice,
      invoice_number: invoice.invoiceNumber,
      customer_id: invoice.customerId,
      customer_name: customer?.fullName || invoice.customerName || '',
      job_id: invoice.jobId,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      payment_date: invoice.paymentDate,
      subtotal: invoice.subtotal,
      tax_amount: invoice.taxAmount,
      discount_amount: invoice.discountAmount,
      created_date: invoice.createdAt,
      updated_date: invoice.updatedAt,
    };
  });

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    first_name: customer.fullName?.split(' ')[0] || '',
    last_name: customer.fullName?.split(' ').slice(1).join(' ') || '',
    company_name: customer.companyName,
    postal_code: customer.postalCode,
    billing_address: customer.billingAddress,
    is_active: customer.isActive,
  }));

  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    work_type_id: job.workTypeId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
    created_date: job.createdAt,
    updated_date: job.updatedAt,
  }));

  const filteredInvoices = transformedInvoices.filter(invoice => {
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
        case "draft":
          matchesAge = invoice.status === 'draft';
          break;
        case "unpaid":
          matchesAge = invoice.status !== 'draft';
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

      <InvoiceStats invoices={transformedInvoices} onFilterChange={(filter) => {
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
        onDelete={handleDelete}
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
          customers={transformedCustomers}
          jobs={transformedJobs}
        />
      )}

      {selectedInvoice && !showDialog && (
        <InvoiceDetails
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEdit={() => setShowDialog(true)}
          onUpdate={handleUpdate}
          onDelete={() => handleDelete(selectedInvoice.id)}
        />
      )}

      {showChart && (
        <InvoiceChart
          open={showChart}
          onClose={() => setShowChart(false)}
          invoices={transformedInvoices}
        />
      )}

      {showExport && (
        <ExportDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          invoices={transformedInvoices}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Grid, List, Download, Upload } from "lucide-react";

// NEW: Import our custom hooks instead of base44
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { useJobs } from "@/hooks/useJobs";

import CustomersList from "../components/customers/CustomersList";
import CustomerDialog from "../components/customers/CustomerDialog";
import CustomerDetails from "../components/customers/CustomerDetails";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setShowDialog(true);
      setSelectedCustomer(null);
    }
  }, []);

  // NEW: Use our custom hooks
  const { data: customersData, isLoading } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const handleSave = (data) => {
    // Transform data from form to match backend schema
    const transformedData = {
      fullName: data.fullName || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      phone: data.phone,
      companyName: data.company_name || data.companyName,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postal_code || data.postalCode,
      billingAddress: data.billing_address || data.billingAddress,
      notes: data.notes,
      isActive: data.is_active !== undefined ? data.is_active : data.isActive !== undefined ? data.isActive : true,
    };

    if (selectedCustomer?.id) {
      updateCustomer.mutate({
        id: selectedCustomer.id,
        data: transformedData
      }, {
        onSuccess: () => {
          setShowDialog(false);
          setSelectedCustomer(null);
        }
      });
    } else {
      createCustomer.mutate(transformedData, {
        onSuccess: () => {
          setShowDialog(false);
          setSelectedCustomer(null);
        }
      });
    }
  };

  // TODO: Implement CSV export/import with backend endpoints
  const handleExport = async () => {
    // For now, create a simple CSV export client-side
    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Address', 'City'];
    const csvData = [
      headers.join(','),
      ...customers.map(c => [
        c.fullName || '',
        c.email || '',
        c.phone || '',
        c.companyName || '',
        c.address || '',
        c.city || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    // TODO: Implement backend CSV import endpoint
    alert('CSV import will be implemented with backend endpoint');
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      customer.fullName?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.includes(search) ||
      customer.companyName?.toLowerCase().includes(search)
    );
  });

  // Transform customers data to match component expectations (snake_case)
  const transformedCustomers = filteredCustomers.map(customer => ({
    ...customer,
    first_name: customer.fullName?.split(' ')[0] || '',
    last_name: customer.fullName?.split(' ').slice(1).join(' ') || '',
    company_name: customer.companyName,
    postal_code: customer.postalCode,
    billing_address: customer.billingAddress,
    is_active: customer.isActive,
  }));

  // Transform jobs data to match component expectations
  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    job_number: job.jobNumber,
    technician_id: job.technicianId,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
    created_date: job.createdAt,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <label>
            <Button variant="outline" disabled={importing} asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import CSV'}
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setShowDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search customers by name, email, phone, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CustomersList
        customers={transformedCustomers}
        isLoading={isLoading}
        onCustomerClick={setSelectedCustomer}
        onDelete={(id) => {
          if (confirm('Supprimer ce client ?')) {
            deleteCustomer.mutate(id);
          }
        }}
        jobs={transformedJobs}
        viewMode={viewMode}
      />

      {showDialog && (
        <CustomerDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedCustomer(null);
          }}
          onSave={handleSave}
          customer={selectedCustomer}
        />
      )}

      {selectedCustomer && !showDialog && (
        <CustomerDetails
          customer={{
            ...selectedCustomer,
            first_name: selectedCustomer.fullName?.split(' ')[0] || '',
            last_name: selectedCustomer.fullName?.split(' ').slice(1).join(' ') || '',
            company_name: selectedCustomer.companyName,
            postal_code: selectedCustomer.postalCode,
            billing_address: selectedCustomer.billingAddress,
            is_active: selectedCustomer.isActive,
          }}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => setShowDialog(true)}
          onUpdate={(data) => updateCustomer.mutate({ id: selectedCustomer.id, data })}
          onDelete={() => deleteCustomer.mutate(selectedCustomer.id)}
          jobs={transformedJobs.filter(j => j.customer_id === selectedCustomer.id)}
        />
      )}
    </div>
  );
}

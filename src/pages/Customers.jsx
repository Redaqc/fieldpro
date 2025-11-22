import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Grid, List, Download, Upload } from "lucide-react";

import CustomersList from "../components/customers/CustomersList";
import CustomerDialog from "../components/customers/CustomerDialog";
import CustomerDetails from "../components/customers/CustomerDetails";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setShowDialog(true);
      setSelectedCustomer(null);
    }
  }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowDialog(false);
      setSelectedCustomer(null);
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
    },
  });

  const handleSave = (data) => {
    if (selectedCustomer?.id) {
      updateCustomerMutation.mutate({ id: selectedCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleExport = async () => {
    const { data } = await base44.functions.invoke('csvExport', { entity_type: 'customers' });
    const blob = new Blob([data.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const { data } = await base44.functions.invoke('csvImport', { 
        entity_type: 'customers',
        csv_data: text 
      });
      alert(`Import réussi: ${data.created} créés, ${data.updated} mis à jour, ${data.failed} échecs`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      customer.first_name?.toLowerCase().includes(search) ||
      customer.last_name?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.includes(search) ||
      customer.company_name?.toLowerCase().includes(search)
    );
  });

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
        customers={filteredCustomers}
        isLoading={isLoading}
        onCustomerClick={setSelectedCustomer}
        onDelete={(id) => {
          if (confirm('Supprimer ce client ?')) {
            deleteCustomerMutation.mutate(id);
          }
        }}
        jobs={jobs}
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
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => setShowDialog(true)}
          onUpdate={updateCustomerMutation.mutate}
          onDelete={() => deleteCustomerMutation.mutate(selectedCustomer.id)}
          jobs={jobs.filter(j => j.customer_id === selectedCustomer.id)}
        />
      )}
    </div>
  );
}
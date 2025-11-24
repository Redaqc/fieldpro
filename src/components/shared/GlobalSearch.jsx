import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Phone, Users, Package, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { JOB_STATUS, INVOICE_STATUS } from "@/constants/statuses";

export default function GlobalSearch({ open, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: serviceCalls = [] } = useQuery({
    queryKey: ['serviceCalls'],
    queryFn: () => base44.entities.ServiceCall.list(),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    initialData: [],
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const search = searchTerm.toLowerCase();
    const found = [];

    // Search Jobs
    jobs.forEach(job => {
      if (
        job.title?.toLowerCase().includes(search) ||
        job.job_number?.toLowerCase().includes(search) ||
        job.customer_name?.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search)
      ) {
        found.push({
          type: 'job',
          icon: Briefcase,
          title: job.title,
          subtitle: `Job #${job.job_number} - ${job.customer_name}`,
          status: job.status,
          url: createPageUrl('Jobs') + `?id=${job.id}`,
          data: job
        });
      }
    });

    // Search Service Calls
    serviceCalls.forEach(call => {
      if (
        call.title?.toLowerCase().includes(search) ||
        call.call_number?.toLowerCase().includes(search) ||
        call.customer_name?.toLowerCase().includes(search)
      ) {
        found.push({
          type: 'service_call',
          icon: Phone,
          title: call.title,
          subtitle: `Call #${call.call_number} - ${call.customer_name}`,
          status: call.status,
          url: createPageUrl('ServiceCalls') + `?id=${call.id}`,
          data: call
        });
      }
    });

    // Search Customers
    customers.forEach(customer => {
      if (
        customer.first_name?.toLowerCase().includes(search) ||
        customer.last_name?.toLowerCase().includes(search) ||
        customer.company_name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search)
      ) {
        found.push({
          type: 'customer',
          icon: Users,
          title: `${customer.first_name} ${customer.last_name}`,
          subtitle: customer.company_name || customer.email,
          url: createPageUrl('Customers') + `?id=${customer.id}`,
          data: customer
        });
      }
    });

    // Search Materials
    materials.forEach(material => {
      if (
        material.name?.toLowerCase().includes(search) ||
        material.code?.toLowerCase().includes(search) ||
        material.description?.toLowerCase().includes(search)
      ) {
        found.push({
          type: 'material',
          icon: Package,
          title: material.name,
          subtitle: `${material.code} - Stock: ${material.quantity_in_stock || 0}`,
          url: createPageUrl('Materials') + `?id=${material.id}`,
          data: material
        });
      }
    });

    // Search Invoices
    invoices.forEach(invoice => {
      if (
        invoice.invoice_number?.toLowerCase().includes(search) ||
        invoice.customer_name?.toLowerCase().includes(search)
      ) {
        found.push({
          type: 'invoice',
          icon: FileText,
          title: `Invoice #${invoice.invoice_number}`,
          subtitle: `${invoice.customer_name} - $${invoice.total?.toFixed(2) || '0.00'}`,
          status: invoice.status,
          url: createPageUrl('Invoices') + `?id=${invoice.id}`,
          data: invoice
        });
      }
    });

    setResults(found.slice(0, 20)); // Limit to 20 results
  }, [searchTerm, jobs, serviceCalls, customers, materials, invoices]);

  const handleSelect = (result) => {
    navigate(result.url);
    onClose();
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs, customers, materials, invoices..."
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && searchTerm && (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}

          {results.length === 0 && !searchTerm && (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Start typing to search across all data...</p>
            </div>
          )}

          {results.map((result, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(result)}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <result.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{result.title}</p>
                <p className="text-sm text-slate-500 truncate">{result.subtitle}</p>
              </div>
              {result.status && (
                <div className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${result.status === JOB_STATUS.COMPLETED ? 'bg-green-100 text-green-700' :
                    result.status === JOB_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                    result.status === INVOICE_STATUS.PAID ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-700'}
                `}>
                  {result.status}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
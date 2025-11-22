import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Search, Filter, Download, Eye, Trash2, Tag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// NEW: Import our custom hooks
import { useDocumentss, useDeleteDocuments } from "@/hooks/useDocumentss";
import { useJobs } from "@/hooks/useJobs";
import { useCustomers } from "@/hooks/useCustomers";

import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import DocumentsList from "@/components/documents/DocumentsList";
import DocumentPreview from "@/components/documents/DocumentPreview";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // NEW: Use our custom hooks
  const { data: documentsData } = useDocumentss({ page: 1, limit: 1000 });
  const documents = documentsData?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const deleteDocMutation = useDeleteDocuments();

  // Transform data to match component expectations (snake_case)
  const transformedDocuments = documents.map(doc => ({
    ...doc,
    expiry_date: doc.expiryDate,
    uploaded_by: doc.uploadedBy,
    uploaded_at: doc.uploadedAt,
    file_size: doc.fileSize,
    file_type: doc.fileType,
    file_url: doc.fileUrl,
    is_public: doc.isPublic,
  }));

  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
  }));

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    first_name: customer.fullName?.split(' ')[0] || '',
    last_name: customer.fullName?.split(' ').slice(1).join(' ') || '',
    company_name: customer.companyName,
  }));

  const filteredDocs = transformedDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    let matchesExpiry = true;
    if (expiryFilter === 'expired' && doc.expiry_date) {
      matchesExpiry = new Date(doc.expiry_date) < new Date();
    } else if (expiryFilter === 'expiring_soon' && doc.expiry_date) {
      const daysUntilExpiry = (new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
      matchesExpiry = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    } else if (expiryFilter === 'no_expiry') {
      matchesExpiry = !doc.expiry_date;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesExpiry;
  });

  const handlePreview = (doc) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer ce document?')) {
      deleteDocMutation.mutate(id);
    }
  };

  const statsByCategory = {
    total: transformedDocuments.length,
    contract: transformedDocuments.filter(d => d.category === 'contract').length,
    invoice: transformedDocuments.filter(d => d.category === 'invoice').length,
    report: transformedDocuments.filter(d => d.category === 'report').length,
    safety: transformedDocuments.filter(d => d.category === 'safety').length,
    inspection: transformedDocuments.filter(d => d.category === 'inspection').length,
    expired: transformedDocuments.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length,
    expiring_soon: transformedDocuments.filter(d => {
      if (!d.expiry_date) return false;
      const days = (new Date(d.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 30;
    }).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Gestion des Documents
          </h1>
          <p className="text-slate-500 mt-1">Centralisez tous vos documents</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Nouveau Document
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{statsByCategory.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Contrats</p>
          <p className="text-2xl font-bold text-slate-900">{statsByCategory.contract}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-slate-500">Factures</p>
          <p className="text-2xl font-bold text-slate-900">{statsByCategory.invoice}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-sm text-slate-500">Sécurité</p>
          <p className="text-2xl font-bold text-slate-900">{statsByCategory.safety}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Inspections</p>
          <p className="text-2xl font-bold text-slate-900">{statsByCategory.inspection}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <p className="text-sm text-slate-500">Expire bientôt</p>
          <p className="text-2xl font-bold text-amber-900">{statsByCategory.expiring_soon}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-600">
          <p className="text-sm text-slate-500">Expirés</p>
          <p className="text-2xl font-bold text-red-900">{statsByCategory.expired}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, description ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="contract">Contrats</SelectItem>
            <SelectItem value="invoice">Factures</SelectItem>
            <SelectItem value="report">Rapports</SelectItem>
            <SelectItem value="certificate">Certificats</SelectItem>
            <SelectItem value="safety">Sécurité</SelectItem>
            <SelectItem value="inspection">Inspections</SelectItem>
            <SelectItem value="other">Autres</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="expired">Expiré</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Expiration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes dates</SelectItem>
            <SelectItem value="expired">Expirés</SelectItem>
            <SelectItem value="expiring_soon">Expire dans 30j</SelectItem>
            <SelectItem value="no_expiry">Sans expiration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DocumentsList
        documents={filteredDocs}
        onPreview={handlePreview}
        onDelete={handleDelete}
        jobs={transformedJobs}
        customers={transformedCustomers}
      />

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        jobs={transformedJobs}
        customers={transformedCustomers}
      />

      <DocumentPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        document={selectedDoc}
      />
    </div>
  );
}

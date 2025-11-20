import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Search, Filter, Download, Eye, Trash2, Tag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import DocumentsList from "@/components/documents/DocumentsList";
import DocumentPreview from "@/components/documents/DocumentPreview";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list(),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handlePreview = (doc) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const statsByCategory = {
    total: documents.length,
    contract: documents.filter(d => d.category === 'contract').length,
    invoice: documents.filter(d => d.category === 'invoice').length,
    report: documents.filter(d => d.category === 'report').length,
    safety: documents.filter(d => d.category === 'safety').length,
    inspection: documents.filter(d => d.category === 'inspection').length,
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher un document..."
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
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="contract">Contrats</SelectItem>
            <SelectItem value="invoice">Factures</SelectItem>
            <SelectItem value="report">Rapports</SelectItem>
            <SelectItem value="certificate">Certificats</SelectItem>
            <SelectItem value="safety">Sécurité</SelectItem>
            <SelectItem value="inspection">Inspections</SelectItem>
            <SelectItem value="other">Autres</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DocumentsList 
        documents={filteredDocs}
        onPreview={handlePreview}
        onDelete={(id) => {
          if (confirm('Supprimer ce document?')) {
            deleteDocMutation.mutate(id);
          }
        }}
        jobs={jobs}
        customers={customers}
      />

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        jobs={jobs}
        customers={customers}
      />

      <DocumentPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        document={selectedDoc}
      />
    </div>
  );
}
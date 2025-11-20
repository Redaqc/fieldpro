import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, Download, Search, DollarSign, Package, Calendar, Edit, Trash2, Upload } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function CostsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const currentTech = technicians.find(t => t.email === currentUser?.email);
  const isAdminOrManager = currentUser?.role === 'admin' || currentTech?.role === 'admin' || currentTech?.role === 'manager';

  const { data: supplierInvoices = [] } = useQuery({
    queryKey: ['supplierInvoices'],
    queryFn: () => base44.entities.SupplierInvoice.list(),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplierInvoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
      setDialogOpen(false);
      setSelectedInvoice(null);
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupplierInvoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
      setDialogOpen(false);
      setSelectedInvoice(null);
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => base44.entities.SupplierInvoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
    },
  });

  const filteredInvoices = supplierInvoices.filter(invoice => {
    const matchesSearch = invoice.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || invoice.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const handleSave = (formData) => {
    if (selectedInvoice) {
      updateInvoiceMutation.mutate({ id: selectedInvoice.id, data: formData });
    } else {
      createInvoiceMutation.mutate(formData);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Numéro', 'Fournisseur', 'Projet', 'Catégorie', 'Montant', 'Date', 'Statut'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number || '',
      inv.supplier_name,
      inv.job_title || '',
      inv.category,
      inv.amount.toFixed(2),
      inv.invoice_date,
      inv.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factures_fournisseurs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (!isAdminOrManager) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
            <p className="text-slate-600">
              La gestion des coûts est réservée aux administrateurs et gestionnaires.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des coûts</h1>
          <p className="text-slate-500 mt-1">Factures fournisseurs et dépenses par projet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => { setSelectedInvoice(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total dépenses</p>
                <p className="text-2xl font-bold text-red-600">${totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">En attente</p>
                <p className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Payé</p>
                <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="materials">Matériaux</SelectItem>
                <SelectItem value="equipment">Équipement</SelectItem>
                <SelectItem value="subcontractor">Sous-traitant</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <Card>
        <CardHeader>
          <CardTitle>Factures fournisseurs ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">Numéro</th>
                  <th className="text-left p-3">Fournisseur</th>
                  <th className="text-left p-3">Projet</th>
                  <th className="text-left p-3">Catégorie</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Montant</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-400">
                      Aucune facture
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{invoice.invoice_number}</td>
                      <td className="p-3 font-medium">{invoice.supplier_name}</td>
                      <td className="p-3 text-slate-600">{invoice.job_title || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs bg-slate-100">
                          {invoice.category}
                        </span>
                      </td>
                      <td className="p-3">
                        {invoice.invoice_date && format(parseISO(invoice.invoice_date), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="p-3 text-right font-semibold">${invoice.amount.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {invoice.status === 'paid' ? 'Payé' :
                           invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedInvoice(invoice); setDialogOpen(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Supprimer cette facture?')) {
                                deleteInvoiceMutation.mutate(invoice.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <InvoiceDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        jobs={jobs}
        onSave={handleSave}
      />
    </div>
  );
}

function InvoiceDialog({ open, onClose, invoice, jobs, onSave }) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    supplier_name: '',
    job_id: '',
    job_title: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    amount: 0,
    category: 'materials',
    status: 'pending',
    notes: '',
    attachment_url: '',
  });

  const [uploadingFile, setUploadingFile] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      setFormData({
        invoice_number: '',
        supplier_name: '',
        job_id: '',
        job_title: '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: '',
        amount: 0,
        category: 'materials',
        status: 'pending',
        notes: '',
        attachment_url: '',
      });
    }
  }, [invoice, open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, attachment_url: file_url });
    } catch (error) {
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.supplier_name || !formData.amount) {
      alert('Veuillez remplir les champs requis');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Modifier la facture' : 'Nouvelle facture fournisseur'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Numéro de facture *</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="INV-001"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Fournisseur *</Label>
              <Input
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="Nom du fournisseur"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Projet</Label>
              <Select 
                value={formData.job_id || ''} 
                onValueChange={(value) => {
                  const job = jobs.find(j => j.id === value);
                  setFormData({ 
                    ...formData, 
                    job_id: value,
                    job_title: job?.title || ''
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Aucun projet</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Matériaux</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                  <SelectItem value="subcontractor">Sous-traitant</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date de facture *</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Montant ($) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Fichier joint</Label>
            <div className="mt-1">
              {formData.attachment_url ? (
                <div className="flex items-center gap-2">
                  <a 
                    href={formData.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Voir le fichier
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, attachment_url: '' })}
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-slate-50">
                    <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      {uploadingFile ? 'Upload en cours...' : 'Cliquez pour uploader'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {invoice ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
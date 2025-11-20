import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function DocumentUploadDialog({ open, onClose, jobs, customers }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    job_id: '',
    customer_id: '',
    tags: [],
    expiry_date: '',
    status: 'active',
  });
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const createDocMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose();
      setFormData({
        name: '',
        description: '',
        category: 'other',
        job_id: '',
        customer_id: '',
        tags: [],
        expiry_date: '',
        status: 'active',
      });
      setFile(null);
      setTagInput('');
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.name) {
        setFormData({ ...formData, name: selectedFile.name });
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !formData.name) {
      alert('Fichier et nom requis');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const docData = {
        ...formData,
        file_url,
        file_size: file.size,
        file_type: file.type,
        tags: formData.tags,
      };

      createDocMutation.mutate(docData);
    } catch (error) {
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {file ? file.name : 'Cliquez pour sélectionner un fichier'}
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </Label>
          </div>

          <div>
            <Label>Nom du document *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom..."
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contrat</SelectItem>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="report">Rapport</SelectItem>
                  <SelectItem value="certificate">Certificat</SelectItem>
                  <SelectItem value="safety">Sécurité</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Date d'expiration</Label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                    setTagInput('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (tagInput.trim()) {
                    setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                    setTagInput('');
                  }
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Job associé</Label>
              <Select value={formData.job_id} onValueChange={(value) => setFormData({ ...formData, job_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Client associé</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'Upload...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
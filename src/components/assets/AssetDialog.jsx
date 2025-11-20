import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Upload, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function AssetDialog({ open, onClose, onSave, asset }) {
  const [formData, setFormData] = useState(asset || {
    name: "",
    type: "equipment",
    brand: "",
    model: "",
    serial_number: "",
    location: "",
    assigned_to: "",
    assigned_to_name: "",
    purchase_date: "",
    purchase_price: 0,
    warranty_date: "",
    status: "available",
    last_service_date: "",
    due_service_date: "",
    service_interval_days: 90,
    photos: [],
    notes: ""
  });

  const [uploading, setUploading] = useState(false);
  const [scanningOCR, setScanningOCR] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTechnicianSelect = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    if (tech) {
      handleChange('assigned_to', techId);
      handleChange('assigned_to_name', `${tech.first_name} ${tech.last_name}`);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newPhotos = [...(formData.photos || []), file_url];
      handleChange('photos', newPhotos);
    } catch (error) {
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    handleChange('photos', newPhotos);
  };

  const handleOCRScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningOCR(true);
    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Use LLM to extract serial number and model
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: "Extract the serial number and model number from this image. Return ONLY a JSON object with 'serial_number' and 'model' fields. If you cannot find them, return empty strings.",
        file_urls: file_url,
        response_json_schema: {
          type: "object",
          properties: {
            serial_number: { type: "string" },
            model: { type: "string" }
          }
        }
      });

      if (result.serial_number) {
        handleChange('serial_number', result.serial_number);
      }
      if (result.model) {
        handleChange('model', result.model);
      }

      alert('Scan terminé! Les informations ont été extraites.');
    } catch (error) {
      alert('Erreur lors du scan OCR');
    } finally {
      setScanningOCR(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photos Section */}
          <div>
            <Label>Photos de l'équipement</Label>
            <div className="flex gap-3 flex-wrap mt-2">
              {formData.photos?.map((photo, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPreviewPhoto(photo)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="text-xs text-slate-500">...</div>
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nom de l'équipement *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="ex: Perceuse Milwaukee"
                required
              />
            </div>

            <div>
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hand_tool">Outil à main</SelectItem>
                  <SelectItem value="power_tool">Outil électrique</SelectItem>
                  <SelectItem value="vehicle">Véhicule</SelectItem>
                  <SelectItem value="machinery">Machinerie</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                  <SelectItem value="safety_gear">Équipement de sécurité</SelectItem>
                  <SelectItem value="measuring_tool">Outil de mesure</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigné à</Label>
              <Select value={formData.assigned_to} onValueChange={handleTechnicianSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Non assigné</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Brand</Label>
              <Input
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
              />
            </div>

            <div>
              <Label>Modèle</Label>
              <Input
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Numéro de série</Label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => handleChange('serial_number', e.target.value)}
                  />
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleOCRScan}
                    className="hidden"
                    disabled={scanningOCR}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    disabled={scanningOCR}
                    asChild
                  >
                    <span>
                      {scanningOCR ? (
                        <>
                          <Upload className="w-4 h-4 mr-2 animate-spin" />
                          Scan...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Scanner
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div>
              <Label>Emplacement</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="ex: Entrepôt, Camion #3"
              />
            </div>

            <div>
              <Label>Date d'achat</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleChange('purchase_date', e.target.value)}
              />
            </div>

            <div>
              <Label>Prix d'achat</Label>
              <Input
                type="number"
                value={formData.purchase_price}
                onChange={(e) => handleChange('purchase_price', parseFloat(e.target.value) || 0)}
                step="0.01"
              />
            </div>

            <div>
              <Label>Date de garantie</Label>
              <Input
                type="date"
                value={formData.warranty_date}
                onChange={(e) => handleChange('warranty_date', e.target.value)}
              />
            </div>

            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="in_use">En utilisation</SelectItem>
                  <SelectItem value="maintenance">En maintenance</SelectItem>
                  <SelectItem value="repair_needed">Réparation requise</SelectItem>
                  <SelectItem value="retired">Retiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Dernier entretien</Label>
              <Input
                type="date"
                value={formData.last_service_date}
                onChange={(e) => handleChange('last_service_date', e.target.value)}
              />
            </div>

            <div>
              <Label>Prochain entretien</Label>
              <Input
                type="date"
                value={formData.due_service_date}
                onChange={(e) => handleChange('due_service_date', e.target.value)}
              />
            </div>

            <div>
              <Label>Intervalle d'entretien (jours)</Label>
              <Input
                type="number"
                value={formData.service_interval_days}
                onChange={(e) => handleChange('service_interval_days', parseInt(e.target.value) || 90)}
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Photo Preview Dialog */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Aperçu de la photo</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={previewPhoto} 
                alt="Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
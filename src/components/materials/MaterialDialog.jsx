import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function MaterialDialog({ open, onClose, onSave, material }) {
  const [formData, setFormData] = useState(material || {
    code: "",
    name: "",
    description: "",
    category: "other",
    unit: "each",
    unit_price: 0,
    cost_price: 0,
    quantity_in_stock: 0,
    reorder_level: 0,
    supplier: "",
    status: "active",
    notes: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{material ? 'Modifier Matériel' : 'Ajouter Matériel'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code/SKU</Label>
              <Input
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="MAT-001"
              />
            </div>

            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom du matériel"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description détaillée"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiber_optic">Fibre Optique</SelectItem>
                  <SelectItem value="cable">Câble</SelectItem>
                  <SelectItem value="connector">Connecteur</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                  <SelectItem value="hardware">Matériel</SelectItem>
                  <SelectItem value="tool">Outil</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unité</Label>
              <Input
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="each, m, ft"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prix Unitaire *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label>Coût Unitaire</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => handleChange('cost_price', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantité en Stock</Label>
              <Input
                type="number"
                value={formData.quantity_in_stock}
                onChange={(e) => handleChange('quantity_in_stock', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label>Niveau de Réapprovisionnement</Label>
              <Input
                type="number"
                value={formData.reorder_level}
                onChange={(e) => handleChange('reorder_level', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fournisseur</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                placeholder="Nom du fournisseur"
              />
            </div>

            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="discontinued">Discontinué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notes additionnelles"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {material ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
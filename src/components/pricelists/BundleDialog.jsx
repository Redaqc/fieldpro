import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X } from "lucide-react";

export default function BundleDialog({ open, onClose, onSave, bundle }) {
  const [formData, setFormData] = useState(bundle || {
    name: "",
    description: "",
    items: [],
    bundle_price: 0,
    original_price: 0,
    discount_percentage: 0,
    status: "active"
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { service_name: "", description: "", quantity: 1, unit_price: 0 }]
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
    calculatePrices(newItems, formData.bundle_price);
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
    calculatePrices(newItems, formData.bundle_price);
  };

  const calculatePrices = (items, bundlePrice) => {
    const originalPrice = items.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.unit_price || 0)), 0
    );
    
    const discount = originalPrice > 0 && bundlePrice > 0
      ? ((originalPrice - bundlePrice) / originalPrice) * 100
      : 0;
    
    setFormData(prev => ({
      ...prev,
      original_price: originalPrice,
      discount_percentage: Math.round(discount)
    }));
  };

  const handleBundlePriceChange = (price) => {
    handleChange('bundle_price', price);
    calculatePrices(formData.items, price);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bundle ? 'Edit Bundle' : 'Create Bundle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Bundle Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Annual HVAC Maintenance Package"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Bundle Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg">
                  <div className="col-span-4">
                    <Input
                      placeholder="Service name"
                      value={item.service_name}
                      onChange={(e) => updateItem(index, 'service_name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Original Price:</span>
              <span className="font-semibold">${formData.original_price.toFixed(2)}</span>
            </div>
            <div>
              <Label>Bundle Price * (Discounted)</Label>
              <Input
                type="number"
                value={formData.bundle_price}
                onChange={(e) => handleBundlePriceChange(parseFloat(e.target.value))}
                step="0.01"
                required
                className="mt-1"
              />
            </div>
            {formData.discount_percentage > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount:</span>
                <span>{formData.discount_percentage}% OFF</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Bundle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
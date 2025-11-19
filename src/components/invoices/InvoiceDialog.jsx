import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Minus, Copy } from "lucide-react";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function InvoiceDialog({ open, onClose, onSave, invoice, customers, jobs }) {
  const [formData, setFormData] = useState(invoice || {
    customer_id: "",
    customer_name: "",
    project_name: "",
    job_id: "",
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: "draft",
    line_items: [],
    submission_items: [],
    subtotal: 0,
    tax_rate: 5,
    tax_rate_2: 9.975,
    tax_amount: 0,
    tax_amount_2: 0,
    total_amount: 0,
    notes: ""
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showBundleCreate, setShowBundleCreate] = useState(false);

  const { data: priceLists = [] } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list(),
    initialData: [],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      handleChange('customer_id', customerId);
      handleChange('customer_name', `${customer.first_name} ${customer.last_name}`);
    }
  };

  const addItem = (item = null) => {
    const newItem = item || { 
      description: "", 
      quantity: 1, 
      unit_price: 0, 
      total: 0,
      type: "item"
    };
    const newItems = [...formData.line_items, newItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems);
  };

  const addTitle = () => {
    const newItem = { 
      description: "TITRE", 
      type: "title"
    };
    const newItems = [...formData.line_items, newItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addDescription = () => {
    const newItem = { 
      description: "Description", 
      type: "description"
    };
    const newItems = [...formData.line_items, newItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addItemFromPriceList = (priceItem) => {
    addItem({
      description: priceItem.service_name,
      quantity: 1,
      unit_price: priceItem.unit_price,
      total: priceItem.unit_price,
      type: "item"
    });
    setShowPriceList(false);
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems);
  };

  const removeLineItem = (index) => {
    const newItems = formData.line_items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.submission_items || []);
  };

  const toggleItemSelection = (index) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  const createBundleFromSelected = async () => {
    if (selectedItems.length === 0) return;

    const bundleItems = selectedItems
      .map(i => formData.line_items[i])
      .filter(item => item.type === 'item');

    if (bundleItems.length === 0) {
      alert("Sélectionnez au moins un item (pas de titre/description)");
      return;
    }

    const bundleName = prompt("Nom du Bundle:");
    if (!bundleName) return;

    const bundlePrice = bundleItems.reduce((sum, item) => sum + (item.total || 0), 0);

    try {
      const bundleData = {
        name: bundleName,
        items: bundleItems.map(item => ({
          service_name: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0
        })),
        bundle_price: bundlePrice,
        original_price: bundlePrice,
        status: "active"
      };

      await base44.entities.Bundle.create(bundleData);

      // Remove selected items and add bundle
      const remainingItems = formData.line_items.filter((_, i) => !selectedItems.includes(i));
      const bundleItem = {
        description: bundleName,
        quantity: 1,
        unit_price: bundlePrice,
        total: bundlePrice,
        type: "bundle"
      };
      
      const newItems = [...remainingItems, bundleItem];
      setFormData(prev => ({ ...prev, line_items: newItems }));
      setSelectedItems([]);
      calculateTotals(newItems, formData.submission_items || []);
    } catch (error) {
      console.error("Erreur création bundle:", error);
      alert("Erreur lors de la création du bundle");
    }
  };

  const copyToSubmission = () => {
    setFormData(prev => ({
      ...prev,
      submission_items: [...prev.line_items]
    }));
  };

  const calculateTotals = (billingItems) => {
    const billingTotal = billingItems
      .filter(item => item.type === 'item' || item.type === 'bundle')
      .reduce((sum, item) => sum + (item.total || 0), 0);
    
    const taxRate = formData.tax_rate || 5;
    const taxRate2 = formData.tax_rate_2 || 9.975;
    
    const tps = billingTotal * (taxRate / 100);
    const tvq = billingTotal * (taxRate2 / 100);
    const total = billingTotal + tps + tvq;
    
    setFormData(prev => ({
      ...prev,
      subtotal: billingTotal,
      tax_amount: tps,
      tax_amount_2: tvq,
      total_amount: total
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const defaultPriceList = priceLists.find(p => p.is_default) || priceLists[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {invoice ? 'Modifier Facture' : 'Créer Nouvelle Facture'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold">Client *</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerSelect} required>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner" />
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

            <div>
              <Label className="text-sm font-semibold">Nom du Projet</Label>
              <Input
                className="h-9"
                value={formData.project_name}
                onChange={(e) => handleChange('project_name', e.target.value)}
                placeholder="Nom du projet"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Date d'Échéance</Label>
              <Input
                className="h-9"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>
          </div>

          {/* Billing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Facturation</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="font-bold h-8"
                  onClick={() => setShowPriceList(!showPriceList)}
                >
                  Item
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="font-bold h-8"
                  onClick={addTitle}
                >
                  Title
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="font-bold h-8"
                  onClick={addDescription}
                >
                  Description
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="font-bold h-8"
                  onClick={createBundleFromSelected}
                  disabled={selectedItems.length === 0}
                >
                  Bundle
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="font-bold h-8"
                  onClick={copyToSubmission}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy to Submission
                </Button>
              </div>
            </div>

            {/* Price List Selector */}
            {showPriceList && defaultPriceList && (
              <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
                <h4 className="font-semibold text-sm">Liste de Prix</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {defaultPriceList.items?.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addItemFromPriceList(item)}
                      className="text-left p-2 border rounded hover:bg-white transition-colors text-sm"
                    >
                      <div className="font-medium">{item.service_name}</div>
                      <div className="text-xs text-slate-600">${item.unit_price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2">
              {formData.line_items.map((item, index) => {
                if (item.type === 'title') {
                  return (
                    <div key={index} className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(index)}
                        onChange={() => toggleItemSelection(index)}
                        className="w-4 h-4"
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="flex-1 font-bold text-lg border-0 bg-transparent focus-visible:ring-0"
                        placeholder="TITRE"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeLineItem(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                }

                if (item.type === 'description') {
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(index)}
                        onChange={() => toggleItemSelection(index)}
                        className="w-4 h-4"
                      />
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="flex-1 text-sm resize-none"
                        rows={2}
                        placeholder="Description"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeLineItem(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                }

                return (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={() => toggleItemSelection(index)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="col-span-5 h-8 text-sm"
                        placeholder="Description"
                      />
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="col-span-2 h-8 text-sm"
                        placeholder="Qté"
                        min="0"
                      />
                      <Input
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="col-span-2 h-8 text-sm"
                        placeholder="Prix"
                        min="0"
                        step="0.01"
                      />
                      <div className="col-span-3 text-right font-semibold text-sm">
                        ${(item.total || 0).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeLineItem(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total:</span>
              <span className="font-semibold">${formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>TPS (5%):</span>
              <span className="font-semibold">${formData.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>TVQ (9.975%):</span>
              <span className="font-semibold">${formData.tax_amount_2.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${formData.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Submission Section */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-lg font-bold">Soumission</h3>
            {formData.submission_items?.length > 0 ? (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                {formData.submission_items.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    {item.type === 'title' && (
                      <div className="font-bold text-lg">{item.description}</div>
                    )}
                    {item.type === 'description' && (
                      <div className="text-slate-600">{item.description}</div>
                    )}
                    {item.type === 'item' && (
                      <div className="flex justify-between">
                        <span>{item.description} (x{item.quantity})</span>
                        <span className="font-semibold">${item.total.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun item dans la soumission</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-semibold">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="Notes additionnelles..."
              className="text-sm"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
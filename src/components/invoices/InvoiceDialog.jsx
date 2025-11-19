import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Minus, GripVertical, Plus, List, Type, FileText, Package, CircleDot, Eye, Lock } from "lucide-react";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function InvoiceDialog({ open, onClose, onSave, invoice, customers, jobs }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    project_name: "",
    job_id: "",
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    work_start_date: format(new Date(), 'yyyy-MM-dd'),
    sent_date: "",
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
  const [showVariables, setShowVariables] = useState(false);
  const [freezeItems, setFreezeItems] = useState(false);
  const [createFrom, setCreateFrom] = useState("scratch"); // scratch, quotation, job

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    }
  }, [invoice]);

  const { data: priceLists = [] } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list(),
    initialData: [],
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => base44.entities.Quotation.list(),
    initialData: [],
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
    initialData: [],
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => base44.entities.Bundle.list(),
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

  const loadFromQuotation = (quotationId) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return;

    setFormData(prev => ({
      ...prev,
      customer_id: quotation.customer_id,
      customer_name: quotation.customer_name,
      project_name: quotation.project_name,
      line_items: quotation.line_items || [],
      work_start_date: quotation.work_start_date || format(new Date(), 'yyyy-MM-dd'),
    }));
    calculateTotals(quotation.line_items || []);
  };

  const loadFromJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const jobItems = [];
    if (job.invoice_items && job.invoice_items.length > 0) {
      job.invoice_items.forEach(item => {
        jobItems.push({
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: (item.quantity || 1) * (item.unit_price || 0),
          type: "item"
        });
      });
    } else if (job.actual_cost || job.estimated_cost) {
      jobItems.push({
        description: job.title,
        quantity: 1,
        unit_price: job.actual_cost || job.estimated_cost,
        total: job.actual_cost || job.estimated_cost,
        type: "item"
      });
    }

    setFormData(prev => ({
      ...prev,
      customer_id: job.customer_id,
      customer_name: job.customer_name,
      project_name: job.title,
      job_id: jobId,
      line_items: jobItems,
      work_start_date: job.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
    }));
    calculateTotals(jobItems);
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

  const addMaterial = (material) => {
    addItem({
      description: material.name,
      quantity: 1,
      unit_price: material.unit_price,
      total: material.unit_price,
      type: "item"
    });
  };

  const addBundleItems = (bundleId) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    const bundleItem = {
      description: bundle.name,
      quantity: 1,
      unit_price: bundle.bundle_price,
      total: bundle.bundle_price,
      type: "bundle"
    };

    const newItems = [...formData.line_items, bundleItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems);
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
    calculateTotals(newItems);
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
      alert("Sélectionnez au moins un item");
      return;
    }

    const bundleName = prompt("Nom du Bundle:");
    if (!bundleName) return;

    const bundlePrice = bundleItems.reduce((sum, item) => sum + (item.total || 0), 0);

    try {
      await base44.entities.Bundle.create({
        name: bundleName,
        items: bundleItems.map(item => ({
          service_name: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0
        })),
        bundle_price: bundlePrice,
        original_price: bundlePrice,
        status: "active"
      });

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
      calculateTotals(newItems);
    } catch (error) {
      alert("Erreur lors de la création du bundle");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination || freezeItems) return;

    const items = Array.from(formData.line_items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({ ...prev, line_items: items }));
    calculateTotals(items);
  };

  const calculateTotals = (billingItems) => {
    const billingTotal = billingItems
      .filter(item => item.type === 'item' || item.type === 'bundle')
      .reduce((sum, item) => sum + (item.total || 0), 0);
    
    const tps = billingTotal * 0.05;
    const tvq = billingTotal * 0.09975;
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {invoice ? 'Modifier Facture' : 'Créer Nouvelle Facture'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Create From Options */}
          {!invoice && (
            <div className="flex gap-2 pb-3 border-b">
              <Button
                type="button"
                size="sm"
                variant={createFrom === 'scratch' ? 'default' : 'outline'}
                onClick={() => setCreateFrom('scratch')}
              >
                Nouveau
              </Button>
              <Select onValueChange={loadFromQuotation}>
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder="Depuis Soumission" />
                </SelectTrigger>
                <SelectContent>
                  {quotations.map(q => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.quote_number} - {q.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={loadFromJob}>
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder="Depuis Job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(j => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.job_number} - {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Header Row 1 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerSelect} required>
                <SelectTrigger className="h-9 text-sm">
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
              <Label className="text-xs font-semibold">Nom du Projet</Label>
              <Input
                className="h-9 text-sm"
                value={formData.project_name}
                onChange={(e) => handleChange('project_name', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Date de Début des Travaux</Label>
              <Input
                className="h-9 text-sm"
                type="date"
                value={formData.work_start_date}
                onChange={(e) => handleChange('work_start_date', e.target.value)}
              />
            </div>
          </div>

          {/* Header Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold">Issue Date *</Label>
              <Input
                className="h-9 text-sm"
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange('issue_date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Expiry Date</Label>
              <Input
                className="h-9 text-sm"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Sent Date</Label>
              <Input
                className="h-9 text-sm"
                type="date"
                value={formData.sent_date}
                onChange={(e) => handleChange('sent_date', e.target.value)}
              />
            </div>
          </div>

          {/* Cost Calculator Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">My Cost Calculator</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Show Variables
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={freezeItems ? 'default' : 'outline'}
                  className="h-8 text-xs"
                  onClick={() => setFreezeItems(!freezeItems)}
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Freeze Items
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 font-semibold"
                onClick={() => addItem()}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 font-semibold"
                onClick={() => setShowPriceList(!showPriceList)}
              >
                <List className="w-3 h-3 mr-1" />
                Items
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 font-semibold"
                onClick={addTitle}
              >
                <Type className="w-3 h-3 mr-1" />
                Title
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 font-semibold"
                onClick={addDescription}
              >
                <FileText className="w-3 h-3 mr-1" />
                Description
              </Button>
              <Select onValueChange={addBundleItems}>
                <SelectTrigger className="w-40 h-8 font-semibold">
                  <SelectValue placeholder="Choose from Bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundles.filter(b => b.status === 'active').map(bundle => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 font-semibold"
                onClick={createBundleFromSelected}
                disabled={selectedItems.length === 0}
              >
                <CircleDot className="w-3 h-3 mr-1" />
                Create Bundle
              </Button>
              <Select onValueChange={(id) => {
                const material = materials.find(m => m.id === id);
                if (material) addMaterial(material);
              }}>
                <SelectTrigger className="w-32 h-8 font-semibold">
                  <SelectValue placeholder="Matériaux" />
                </SelectTrigger>
                <SelectContent>
                  {materials.filter(m => m.status === 'active').map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price List Dropdown */}
            {showPriceList && defaultPriceList && (
              <div className="border rounded p-3 bg-slate-50">
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {defaultPriceList.items?.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addItemFromPriceList(item)}
                      className="text-left p-2 border rounded hover:bg-white text-xs"
                    >
                      <div className="font-medium">{item.service_name}</div>
                      <div className="text-slate-600">${item.unit_price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-slate-100 p-2 text-xs font-semibold border-b">
                <div className="col-span-1"></div>
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y">
                      {formData.line_items.map((item, index) => (
                        <Draggable 
                          key={index} 
                          draggableId={`item-${index}`} 
                          index={index}
                          isDragDisabled={freezeItems}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-slate-50"
                            >
                              <div className="col-span-1 flex items-center gap-1">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(index)}
                                  onChange={() => toggleItemSelection(index)}
                                  className="w-3 h-3"
                                />
                              </div>

                              {item.type === 'title' ? (
                                <>
                                  <Input
                                    value={item.description}
                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                    className="col-span-9 h-8 font-bold text-sm border-0 bg-transparent"
                                    placeholder="TITRE"
                                  />
                                  <div className="col-span-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => removeLineItem(index)}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </>
                              ) : item.type === 'description' ? (
                                <>
                                  <Textarea
                                    value={item.description}
                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                    className="col-span-9 text-xs resize-none"
                                    rows={2}
                                  />
                                  <div className="col-span-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => removeLineItem(index)}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Input
                                    value={item.description}
                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                    className="col-span-5 h-8 text-sm"
                                    disabled={freezeItems}
                                  />
                                  <Input
                                    type="number"
                                    value={item.quantity || ''}
                                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="col-span-2 h-8 text-sm text-center"
                                    disabled={freezeItems}
                                  />
                                  <Input
                                    type="number"
                                    value={item.unit_price || ''}
                                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                    className="col-span-2 h-8 text-sm text-center"
                                    step="0.01"
                                    disabled={freezeItems}
                                  />
                                  <div className="col-span-1 text-right font-semibold text-sm">
                                    ${(item.total || 0).toLocaleString()}
                                  </div>
                                  <div className="col-span-1 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => removeLineItem(index)}
                                      disabled={freezeItems}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-1 max-w-xs ml-auto">
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
            <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
              <span>Total:</span>
              <span>${formData.total_amount.toFixed(2)}</span>
            </div>
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
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, GripVertical, Type, FileText, Package, CircleDot, EyeOff } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function InvoicingTab({ job, formData, setFormData }) {
  const [lineItems, setLineItems] = useState(formData.invoice_items || []);

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => base44.entities.Bundle.list(),
    initialData: [],
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
    initialData: [],
  });

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
  const canViewPrices = currentUser?.role === 'admin' || currentTech?.can_view_prices !== false;

  const addItem = () => {
    const newItem = {
      description: "",
      quantity: 1,
      unit_price: 0,
      total: 0,
      type: "item"
    };
    const newItems = [...lineItems, newItem];
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const addTitle = () => {
    const newItem = {
      description: "TITRE",
      type: "title"
    };
    const newItems = [...lineItems, newItem];
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const addDescription = () => {
    const newItem = {
      description: "Description",
      type: "description"
    };
    const newItems = [...lineItems, newItem];
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const addMaterial = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const newItem = {
      description: material.name,
      quantity: 1,
      unit_price: material.unit_price,
      total: material.unit_price,
      type: "item"
    };
    const newItems = [...lineItems, newItem];
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const addBundleItems = (bundleId) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    const bundleItemsToAdd = bundle.items?.map(item => ({
      description: item.service_name || item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: (item.quantity || 1) * (item.unit_price || 0),
      type: "item"
    })) || [];

    const newItems = [...lineItems, ...bundleItemsToAdd];
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const removeLineItem = (index) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    updateFormData(newItems);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(lineItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLineItems(items);
    updateFormData(items);
  };

  const updateFormData = (items) => {
    const subtotal = items
      .filter(item => item.type === 'item')
      .reduce((sum, item) => sum + (item.total || 0), 0);
    
    const tps = subtotal * 0.05;
    const tvq = subtotal * 0.09975;
    const total = subtotal + tps + tvq;

    setFormData(prev => ({
      ...prev,
      invoice_items: items,
      invoice_subtotal: subtotal,
      invoice_tps: tps,
      invoice_tvq: tvq,
      invoice_total: total
    }));
  };

  const calculateTotals = () => {
    const subtotal = lineItems
      .filter(item => item.type === 'item')
      .reduce((sum, item) => sum + (item.total || 0), 0);
    
    const tps = subtotal * 0.05;
    const tvq = subtotal * 0.09975;
    const total = subtotal + tps + tvq;

    return { subtotal, tps, tvq, total };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Éléments de Facturation</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={addItem}
          >
            <Plus className="w-3 h-3 mr-1" />
            Item
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={addTitle}
          >
            <Type className="w-3 h-3 mr-1" />
            Titre
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={addDescription}
          >
            <FileText className="w-3 h-3 mr-1" />
            Description
          </Button>
          <Select onValueChange={addBundleItems}>
            <SelectTrigger className="w-32 h-8 font-semibold">
              <SelectValue placeholder="Bundle" />
            </SelectTrigger>
            <SelectContent>
              {bundles.filter(b => b.status === 'active').map(bundle => (
                <SelectItem key={bundle.id} value={bundle.id}>
                  {bundle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={addMaterial}>
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
      </div>

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        {canViewPrices ? (
          <div className="grid grid-cols-12 gap-2 bg-slate-100 p-2 text-xs font-semibold border-b">
            <div className="col-span-1"></div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-2 text-center">Prix Unit.</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-2 bg-slate-100 p-2 text-xs font-semibold border-b">
            <div className="col-span-1"></div>
            <div className="col-span-9">Description</div>
            <div className="col-span-2 text-center">Qté</div>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="invoice-items">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y min-h-[100px]">
                {lineItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Aucun élément. Cliquez sur "Item" pour ajouter.</p>
                  </div>
                ) : (
                  lineItems.map((item, index) => (
                    <Draggable
                      key={index}
                      draggableId={`invoice-item-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-slate-50"
                        >
                          <div className="col-span-1 flex items-center">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                            </div>
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
                                  <Minus className="w-4 h-4 text-red-500" />
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
                                placeholder="Description détaillée..."
                              />
                              <div className="col-span-2 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeLineItem(index)}
                                >
                                  <Minus className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </>
                          ) : canViewPrices ? (
                            <>
                              <Input
                                value={item.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                className="col-span-5 h-8 text-sm"
                                placeholder="Description..."
                              />
                              <Input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="col-span-2 h-8 text-sm text-center"
                              />
                              <Input
                                type="number"
                                value={item.unit_price || ''}
                                onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="col-span-2 h-8 text-sm text-center"
                                step="0.01"
                              />
                              <div className="col-span-1 text-right font-semibold text-sm">
                                ${(item.total || 0).toFixed(2)}
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeLineItem(index)}
                                >
                                  <Minus className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Input
                                value={item.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                className="col-span-9 h-8 text-sm"
                                placeholder="Description..."
                              />
                              <Input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="col-span-2 h-8 text-sm text-center"
                              />
                              <div className="col-span-1 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeLineItem(index)}
                                >
                                  <Minus className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Totals */}
      {lineItems.length > 0 && canViewPrices && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-1 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span>Sous-total:</span>
            <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>TPS (5%):</span>
            <span className="font-semibold">${totals.tps.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>TVQ (9.975%):</span>
            <span className="font-semibold">${totals.tvq.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
            <span>Total:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {lineItems.length > 0 && !canViewPrices && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <EyeOff className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-sm text-amber-700">Les prix sont masqués pour votre rôle</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium">Notes de facturation</Label>
        <Textarea
          value={formData.invoice_notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, invoice_notes: e.target.value }))}
          placeholder="Notes additionnelles pour la facture..."
          rows={3}
          className="mt-1"
        />
      </div>
    </div>
  );
}
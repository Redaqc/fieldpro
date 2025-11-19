import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Minus, GripVertical, Plus, List, Type, FileText, Package, CircleDot, Eye, Lock, Download } from "lucide-react";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function InvoiceDialog({ open, onClose, onSave, invoice, customers, jobs }) {
  const [formData, setFormData] = useState({
    invoice_number: "",
    po_number: "",
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
  const [showItemSelector, setShowItemSelector] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      // Generate invoice number for new invoices
      base44.entities.Invoice.list('-invoice_number', 1000).then(invoices => {
        const invoiceNumbers = invoices
          .map(inv => parseInt(inv.invoice_number?.split('-')[1] || '0'))
          .filter(num => !isNaN(num));
        
        const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
        const newNumber = `INV-${String(maxNumber + 1).padStart(6, '0')}`;
        setFormData(prev => ({ ...prev, invoice_number: newNumber }));
      }).catch(() => {
        setFormData(prev => ({ ...prev, invoice_number: 'INV-000001' }));
      });
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
    if (!quotationId) return;
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return;

    // Copier tous les line_items individuellement
    const items = quotation.line_items?.map(item => ({
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: (item.quantity || 1) * (item.unit_price || 0),
      type: item.type || "item"
    })) || [];

    setFormData(prev => ({
      ...prev,
      customer_id: quotation.customer_id,
      customer_name: quotation.customer_name,
      project_name: quotation.project_name,
      line_items: items,
      work_start_date: quotation.work_start_date || format(new Date(), 'yyyy-MM-dd'),
    }));
    calculateTotals(items);
  };

  const loadFromJob = (jobId) => {
    if (!jobId) return;
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Copier tous les invoice_items individuellement
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

    // Add each item from the bundle individually
    const bundleItemsToAdd = bundle.items?.map(item => ({
      description: item.service_name || item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: (item.quantity || 1) * (item.unit_price || 0),
      type: "item"
    })) || [];

    const newItems = [...formData.line_items, ...bundleItemsToAdd];
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
    if (selectedItems.length === 0) {
      alert("Sélectionnez au moins un item");
      return;
    }

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

      alert(`Bundle "${bundleName}" créé avec succès!`);
      setSelectedItems([]);
    } catch (error) {
      console.error("Erreur création bundle:", error);
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

  const downloadPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; }
          }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 { 
            color: #1e40af; 
            margin: 0;
            font-size: 32px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0;
          }
          th { 
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #1e40af;
            font-weight: bold;
          }
          td { 
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .text-right { text-align: right; }
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .total-final {
            font-weight: bold;
            font-size: 20px;
            border-top: 2px solid #1e40af;
            padding-top: 10px;
            margin-top: 10px;
          }
          .notes {
            margin-top: 40px;
            padding: 15px;
            background: #f9fafb;
            border-left: 4px solid #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURE</h1>
          <p style="margin: 5px 0; color: #666;">Numéro: ${formData.invoice_number}</p>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-item">
              <div class="info-label">Client</div>
              <div>${formData.customer_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Projet</div>
              <div>${formData.project_name || 'N/A'}</div>
            </div>
            ${formData.po_number ? `
            <div class="info-item">
              <div class="info-label">Numéro PO</div>
              <div>${formData.po_number}</div>
            </div>
            ` : ''}
          </div>
          <div>
            <div class="info-item">
              <div class="info-label">Date d'émission</div>
              <div>${format(new Date(formData.issue_date), 'dd/MM/yyyy')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date d'échéance</div>
              <div>${format(new Date(formData.due_date), 'dd/MM/yyyy')}</div>
            </div>
            ${formData.work_start_date ? `
            <div class="info-item">
              <div class="info-label">Début des travaux</div>
              <div>${format(new Date(formData.work_start_date), 'dd/MM/yyyy')}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${formData.line_items.map(item => {
              if (item.type === 'title') {
                return `<tr><td colspan="4" style="font-weight: bold; font-size: 16px; padding-top: 20px;">${item.description}</td></tr>`;
              }
              if (item.type === 'description') {
                return `<tr><td colspan="4" style="color: #666; font-style: italic;">${item.description}</td></tr>`;
              }
              return `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${(item.unit_price || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600;">$${(item.total || 0).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Sous-total:</span>
            <span>$${formData.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>TPS (5%):</span>
            <span>$${formData.tax_amount.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>TVQ (9.975%):</span>
            <span>$${formData.tax_amount_2.toFixed(2)}</span>
          </div>
          <div class="totals-row total-final">
            <span>TOTAL:</span>
            <span>$${formData.total_amount.toFixed(2)}</span>
          </div>
        </div>

        ${formData.notes ? `
        <div class="notes">
          <div class="info-label">Notes</div>
          <div>${formData.notes}</div>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
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
                  <SelectItem value={null}>-- Sélectionner --</SelectItem>
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
                  <SelectItem value={null}>-- Sélectionner --</SelectItem>
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
          <div className="grid grid-cols-4 gap-4">
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
              <Label className="text-xs font-semibold">Numéro de Facture</Label>
              <Input
                className="h-9 text-sm font-semibold"
                value={formData.invoice_number}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
                readOnly
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Numéro de PO</Label>
              <Input
                className="h-9 text-sm"
                value={formData.po_number}
                onChange={(e) => handleChange('po_number', e.target.value)}
                placeholder="Numéro de PO"
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
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-semibold">Nom du Projet</Label>
              <Input
                className="h-9 text-sm"
                value={formData.project_name}
                onChange={(e) => handleChange('project_name', e.target.value)}
              />
            </div>

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
              <Select onValueChange={(id) => {
                const item = defaultPriceList?.items?.find(i => i.service_name === id);
                if (item) addItemFromPriceList(item);
              }}>
                <SelectTrigger className="w-24 h-8 font-semibold">
                  <SelectValue placeholder="Items" />
                </SelectTrigger>
                <SelectContent>
                  {defaultPriceList?.items?.map((item, idx) => (
                    <SelectItem key={idx} value={item.service_name}>
                      {item.service_name} - ${item.unit_price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                                    ${(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <span className="font-semibold">${formData.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>TPS (5%):</span>
              <span className="font-semibold">${formData.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>TVQ (9.975%):</span>
              <span className="font-semibold">${formData.tax_amount_2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
              <span>Total:</span>
              <span>${formData.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            {invoice && (
              <Button type="button" variant="outline" onClick={downloadPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Télécharger PDF
              </Button>
            )}
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
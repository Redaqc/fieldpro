import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X, Package, List, FileText, Heading, Copy, Minus } from "lucide-react";
import { addDays, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";

export default function QuotationDialog({ open, onClose, onSave, quotation, customers, bundles, priceLists }) {
  const [formData, setFormData] = useState(quotation || {
    customer_id: "",
    customer_name: "",
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: "draft",
    line_items: [],
    bundles: [],
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 0,
    notes: "",
    terms: "",
    submission_body: ""
  });

  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showPriceListDialog, setShowPriceListDialog] = useState(false);
  const [showBundleCreator, setShowBundleCreator] = useState(false);
  const [newBundleName, setNewBundleName] = useState("");
  const [newBundleDescription, setNewBundleDescription] = useState("");
  const [showAllVariables, setShowAllVariables] = useState(false);
  const [itemsFrozen, setItemsFrozen] = useState(false);
  const [showSubtotalsOnly, setShowSubtotalsOnly] = useState(false);
  const [showGrandTotalOnly, setShowGrandTotalOnly] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");

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

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: "", quantity: 1, unit_price: 0, total: 0, type: "item" }]
    }));
  };

  const addItemFromPriceList = (priceListItem) => {
    const newItem = {
      description: priceListItem.service_name,
      quantity: 1,
      unit_price: priceListItem.unit_price,
      total: priceListItem.unit_price,
      type: "item"
    };
    const newItems = [...formData.line_items, newItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
    setShowPriceListDialog(false);
  };

  const addTitle = () => {
    const titleItem = {
      description: "Title Section",
      quantity: 0,
      unit_price: 0,
      total: 0,
      type: "title"
    };
    const newItems = selectedItemIndex !== null 
      ? [...formData.line_items.slice(0, selectedItemIndex + 1), titleItem, ...formData.line_items.slice(selectedItemIndex + 1)]
      : [...formData.line_items, titleItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addDescription = () => {
    const descItem = {
      description: "Description text...",
      quantity: 0,
      unit_price: 0,
      total: 0,
      type: "description"
    };
    const newItems = selectedItemIndex !== null 
      ? [...formData.line_items.slice(0, selectedItemIndex + 1), descItem, ...formData.line_items.slice(selectedItemIndex + 1)]
      : [...formData.line_items, descItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const createBundleFromItems = async () => {
    if (!newBundleName.trim()) return;
    
    const itemsForBundle = formData.line_items.filter(item => item.type === "item" && item.total > 0);
    if (itemsForBundle.length === 0) {
      alert("No items to create bundle from");
      return;
    }

    const bundleItems = itemsForBundle.map(item => ({
      service_name: item.description,
      description: "",
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const originalPrice = itemsForBundle.reduce((sum, item) => sum + item.total, 0);
    const bundlePrice = originalPrice * 0.9; // 10% discount

    try {
      await base44.entities.Bundle.create({
        name: newBundleName,
        description: newBundleDescription,
        items: bundleItems,
        bundle_price: bundlePrice,
        original_price: originalPrice,
        discount_percentage: 10,
        status: "active"
      });
      
      alert("Bundle created successfully!");
      setShowBundleCreator(false);
      setNewBundleName("");
      setNewBundleDescription("");
    } catch (error) {
      alert("Failed to create bundle");
    }
  };

  const copyToSubmission = () => {
    let submissionText = "";
    
    formData.line_items.forEach(item => {
      if (item.type === "title") {
        submissionText += `\n\n## ${item.description}\n`;
      } else if (item.type === "description") {
        submissionText += `${item.description}\n`;
      } else {
        submissionText += `- ${item.description} (Qty: ${item.quantity}) - $${item.total.toFixed(2)}\n`;
      }
    });

    if (formData.bundles.length > 0) {
      submissionText += "\n\n## Bundles\n";
      formData.bundles.forEach(bundle => {
        submissionText += `- ${bundle.bundle_name} (Qty: ${bundle.quantity}) - $${bundle.total.toFixed(2)}\n`;
      });
    }

    if (!showSubtotalsOnly && !showGrandTotalOnly) {
      submissionText += `\n\n**Subtotal:** $${formData.subtotal.toFixed(2)}`;
      submissionText += `\n**Tax:** $${formData.tax_amount.toFixed(2)}`;
    }
    
    if (showSubtotalsOnly) {
      submissionText += `\n\n**Subtotal:** $${formData.subtotal.toFixed(2)}`;
    }
    
    submissionText += `\n**Total:** $${formData.total_amount.toFixed(2)}`;

    setFormData(prev => ({ ...prev, submission_body: prev.submission_body + submissionText }));
  };

  const duplicatePreviousCalculation = () => {
    // Logic to duplicate from previous quotations
    alert("Feature to duplicate previous calculation - select from history");
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
  };

  const removeLineItem = (index) => {
    const newItems = formData.line_items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
  };

  const addBundle = (bundleId) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    
    const newBundle = {
      bundle_id: bundle.id,
      bundle_name: bundle.name,
      quantity: 1,
      total: bundle.bundle_price
    };
    
    const newBundles = [...formData.bundles, newBundle];
    setFormData(prev => ({ ...prev, bundles: newBundles }));
    calculateTotals(formData.line_items, newBundles);
  };

  const updateBundleQty = (index, quantity) => {
    const newBundles = [...formData.bundles];
    const bundle = bundles.find(b => b.id === newBundles[index].bundle_id);
    newBundles[index].quantity = quantity;
    newBundles[index].total = quantity * bundle.bundle_price;
    
    setFormData(prev => ({ ...prev, bundles: newBundles }));
    calculateTotals(formData.line_items, newBundles);
  };

  const removeBundle = (index) => {
    const newBundles = formData.bundles.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, bundles: newBundles }));
    calculateTotals(formData.line_items, newBundles);
  };

  const calculateTotals = (items, bundleItems) => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const bundlesTotal = bundleItems.reduce((sum, bundle) => sum + (bundle.total || 0), 0);
    const subtotal = itemsTotal + bundlesTotal;
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer & Basic Info */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerSelect} required>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select customer" />
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
              <Label className="text-xs">Issue Date *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange('issue_date', e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs">Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Cost Calculator Section */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900">My Cost Calculator</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAllVariables(!showAllVariables)}>
                  <span className="text-xs font-bold">{showAllVariables ? 'Hide' : 'Show'} Variables</span>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setItemsFrozen(!itemsFrozen)}>
                  <span className="text-xs font-bold">{itemsFrozen ? 'Unfreeze' : 'Freeze'} Items</span>
                </Button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} disabled={itemsFrozen}>
                <Plus className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Add</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPriceListDialog(true)} disabled={itemsFrozen}>
                <List className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Items</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addTitle} disabled={itemsFrozen}>
                <Heading className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Title</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addDescription} disabled={itemsFrozen}>
                <FileText className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Description</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowBundleCreator(true)} disabled={itemsFrozen}>
                <Package className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Bundle</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={duplicatePreviousCalculation}>
                <Copy className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Duplicate</span>
              </Button>
            </div>

            {/* Items Table Header */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-600">
              <div className="col-span-6">Item</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Items List */}
            <div className="space-y-1 mb-4 max-h-64 overflow-y-auto">
              {formData.line_items.map((item, index) => {
                if (item.type === "title") {
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Input
                        placeholder="Title"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="font-bold border-0 bg-transparent h-8"
                        disabled={itemsFrozen}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-7 w-7" disabled={itemsFrozen}>
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                }
                
                if (item.type === "description") {
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <Textarea
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="text-xs border-0 bg-transparent min-h-[60px]"
                        disabled={itemsFrozen}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-7 w-7" disabled={itemsFrozen}>
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                }

                return (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2 hover:bg-slate-50 rounded items-center">
                    <div className="col-span-6">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="h-8 text-sm"
                        disabled={itemsFrozen}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        disabled={itemsFrozen}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="h-8 text-sm"
                        disabled={itemsFrozen}
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="font-semibold text-sm">${(item.total || 0).toFixed(3)}</span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-7 w-7" disabled={itemsFrozen}>
                        <Minus className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Total Cost:</span>
                <span className="font-bold">${formData.subtotal.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Total Sale:</span>
                <span className="font-bold">${formData.subtotal.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Submission Content Section */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900">Submission Content</h3>
              <Button type="button" size="sm" onClick={copyToSubmission} className="bg-blue-500 hover:bg-blue-600">
                <Copy className="w-3 h-3 mr-1" />
                <span className="text-xs font-bold">Copy to Submission</span>
              </Button>
            </div>

            {/* Items Table Header */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-600">
              <div className="col-span-6">Item</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Preview Items */}
            <div className="space-y-1 mb-4 min-h-[100px] max-h-48 overflow-y-auto bg-slate-50 rounded p-2">
              {formData.line_items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No items added yet</p>
              ) : (
                formData.line_items.filter(i => i.type === 'item').map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 text-sm py-1">
                    <div className="col-span-6">{item.description}</div>
                    <div className="col-span-2">${item.unit_price.toFixed(2)}</div>
                    <div className="col-span-2">{item.quantity}</div>
                    <div className="col-span-2 text-right font-semibold">${item.total.toFixed(3)}</div>
                  </div>
                ))
              )}
            </div>

            {/* Provincial Tax Inputs */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Provincial Tax Title:</Label>
                <Input className="w-48 h-8 text-sm" placeholder="TPS (5%)" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Federal Tax Title:</Label>
                <Input className="w-48 h-8 text-sm" placeholder="TVQ (9.975%)" />
              </div>
            </div>

            {/* Summary Totals */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Total before tax:</span>
                <span className="font-semibold">${formData.subtotal.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total sale:</span>
                <span className="font-semibold">${formData.subtotal.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>TPS (5%):</span>
                <Input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    handleChange('tax_rate', rate);
                    calculateTotals(formData.line_items, formData.bundles);
                  }}
                  className="w-24 h-7 text-right text-sm"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>TVQ (9.975%):</span>
                <span className="font-semibold">${formData.tax_amount.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total:</span>
                <span>${formData.total_amount.toFixed(3)}</span>
              </div>
            </div>

            {/* Display Options */}
            <div className="flex gap-4 mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSubtotalsOnly(!showSubtotalsOnly)} className={showSubtotalsOnly ? 'bg-blue-100' : ''}>
                <span className="text-xs font-bold">Subtotals and Grand Total</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowGrandTotalOnly(!showGrandTotalOnly)} className={showGrandTotalOnly ? 'bg-blue-100' : ''}>
                <span className="text-xs font-bold">Grand Total Only</span>
              </Button>
            </div>

            {/* Profit Section */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Profit on this cost:</span>
                <span className="font-bold text-green-600">${(formData.total_amount - formData.subtotal).toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <Label className="text-sm mb-1">Additional Information</Label>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={2}
              placeholder="Add project details, notes, or attachments..."
              className="text-sm"
            />
          </div>

          {/* Price List Items Dialog */}
          {showPriceListDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPriceListDialog(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Select Item from Price List</h3>
                <div className="space-y-2">
                  {priceLists.flatMap(pl => 
                    (pl.items || []).map((item, idx) => (
                      <div key={`${pl.id}-${idx}`} className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer" onClick={() => addItemFromPriceList(item)}>
                        <div>
                          <p className="font-medium">{item.service_name}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${item.unit_price}</p>
                          <p className="text-xs text-slate-500">{item.unit}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button type="button" className="mt-4 w-full" onClick={() => setShowPriceListDialog(false)}>Close</Button>
              </div>
            </div>
          )}

          {/* Bundle Creator Dialog */}
          {showBundleCreator && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBundleCreator(false)}>
              <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Create Bundle from Items</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Bundle Name</Label>
                    <Input
                      value={newBundleName}
                      onChange={(e) => setNewBundleName(e.target.value)}
                      placeholder="Enter bundle name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newBundleDescription}
                      onChange={(e) => setNewBundleDescription(e.target.value)}
                      placeholder="Enter bundle description"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" className="flex-1" onClick={createBundleFromItems}>Create Bundle</Button>
                    <Button type="button" variant="outline" onClick={() => setShowBundleCreator(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Schedule Later
              </Button>
              <Button type="button" variant="outline" onClick={() => alert('Add deposit account')}>
                Add Deposit Account
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" className="bg-blue-500 hover:bg-blue-600" onClick={() => alert('Create PDF')}>
                Create PDF and Save
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Send
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
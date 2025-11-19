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

    submissionText += `\n\n**Subtotal:** $${formData.subtotal.toFixed(2)}`;
    submissionText += `\n**Tax:** $${formData.tax_amount.toFixed(2)}`;
    submissionText += `\n**Total:** $${formData.total_amount.toFixed(2)}`;

    setFormData(prev => ({ ...prev, submission_body: prev.submission_body + submissionText }));
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerSelect} required>
                <SelectTrigger>
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
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Issue Date *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange('issue_date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="bundles">Bundles</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-3">
              <div className="flex justify-between items-center mb-3">
                <Label>Cost Calculator</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPriceListDialog(true)}>
                    <List className="w-4 h-4 mr-1" />
                    <span className="font-bold">Items</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addTitle}>
                    <Heading className="w-4 h-4 mr-1" />
                    <span className="font-bold">Title</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addDescription}>
                    <FileText className="w-4 h-4 mr-1" />
                    <span className="font-bold">Description</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowBundleCreator(true)}>
                    <Package className="w-4 h-4 mr-1" />
                    <span className="font-bold">Bundle</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={copyToSubmission}>
                    <Copy className="w-4 h-4 mr-1" />
                    <span className="font-bold">Copy to Submission</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.line_items.map((item, index) => {
                  if (item.type === "title") {
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded" onClick={() => setSelectedItemIndex(index)}>
                        <Input
                          placeholder="Title"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="font-bold text-lg border-0 bg-transparent"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                          <Minus className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  }
                  
                  if (item.type === "description") {
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded" onClick={() => setSelectedItemIndex(index)}>
                        <Textarea
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="text-sm border-0 bg-transparent"
                          rows={2}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                          <Minus className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg items-center" onClick={() => setSelectedItemIndex(index)}>
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value))}
                          step="0.01"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="font-semibold text-sm">${(item.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-8 w-8">
                          <Minus className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="bundles" className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Service Bundles</Label>
                <Select onValueChange={addBundle}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add bundle" />
                  </SelectTrigger>
                  <SelectContent>
                    {bundles.filter(b => b.status === 'active').map(bundle => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.name} (${bundle.bundle_price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {formData.bundles.map((bundle, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{bundle.bundle_name}</p>
                    </div>
                    <Input
                      type="number"
                      value={bundle.quantity}
                      onChange={(e) => updateBundleQty(index, parseFloat(e.target.value))}
                      className="w-20 h-9"
                      min="1"
                    />
                    <span className="font-semibold w-24 text-right">${bundle.total.toFixed(2)}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBundle(index)} className="h-8 w-8">
                      <Minus className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">${formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tax Rate (%):</span>
              <Input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  handleChange('tax_rate', rate);
                  calculateTotals(formData.line_items, formData.bundles);
                }}
                className="w-24 text-right"
                step="0.1"
              />
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span className="font-semibold">${formData.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${formData.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label>Submission Body</Label>
            <Textarea
              value={formData.submission_body}
              onChange={(e) => handleChange('submission_body', e.target.value)}
              rows={6}
              placeholder="Content copied from cost calculator will appear here..."
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Quotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
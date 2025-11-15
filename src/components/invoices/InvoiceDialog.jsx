import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X } from "lucide-react";
import { addDays, format } from "date-fns";

export default function InvoiceDialog({ open, onClose, onSave, invoice, customers, jobs }) {
  const [formData, setFormData] = useState(invoice || {
    customer_id: "",
    customer_name: "",
    job_id: "",
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: "draft",
    line_items: [],
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 0,
    notes: ""
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

  const handleJobSelect = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      handleChange('job_id', jobId);
      if (job.actual_cost || job.estimated_cost) {
        addLineItem({
          description: job.title,
          quantity: 1,
          unit_price: job.actual_cost || job.estimated_cost,
          total: job.actual_cost || job.estimated_cost
        });
      }
    }
  };

  const addLineItem = (item = null) => {
    const newItem = item || {
      description: "",
      quantity: 1,
      unit_price: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, newItem]
    }));
    calculateTotals([...formData.line_items, newItem]);
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

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total
    }));
  };

  const handleTaxRateChange = (rate) => {
    handleChange('tax_rate', rate);
    const subtotal = formData.subtotal;
    const taxAmount = subtotal * (rate / 100);
    setFormData(prev => ({
      ...prev,
      tax_amount: taxAmount,
      total_amount: subtotal + taxAmount
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
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
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
              <Label htmlFor="job">Related Job (Optional)</Label>
              <Select value={formData.job_id} onValueChange={handleJobSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.filter(j => j.customer_id === formData.customer_id).map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_number} - {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange('issue_date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={formData.tax_rate}
                onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addLineItem()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="font-semibold">${(item.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">${formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({formData.tax_rate}%):</span>
              <span className="font-semibold">${formData.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${formData.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes or payment terms..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
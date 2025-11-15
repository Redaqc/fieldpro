import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Save, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-800"
};

export default function InvoiceModal({ invoice, customers, jobs, onClose, onDelete }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(invoice);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const customer = customers.find(c => c.id === data.customer_id);
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (parseFloat(data.tax_rate) / 100 || 0);
      const totalAmount = subtotal + taxAmount;
      
      return base44.entities.Invoice.update(invoice.id, {
        ...data,
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : data.customer_name,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        tax_rate: parseFloat(data.tax_rate) || 0,
        paid_amount: parseFloat(data.paid_amount) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setEditMode(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...(formData.line_items || []), { description: "", quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const removeLineItem = (index) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'description' ? value : parseFloat(value) || 0,
    };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData({ ...formData, line_items: newItems });
  };

  const subtotal = formData.line_items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const taxAmount = subtotal * (parseFloat(formData.tax_rate) / 100 || 0);
  const total = subtotal + taxAmount;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Invoice #{invoice.invoice_number || invoice.id.slice(0, 8)}</DialogTitle>
              <Badge className={statusColors[invoice.status]}>
                {invoice.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this invoice?')) {
                        onDelete();
                      }
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer</Label>
              {editMode ? (
                <Select 
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium mt-1">{invoice.customer_name}</p>
              )}
            </div>

            <div>
              <Label>Status</Label>
              {editMode ? (
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
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
              ) : (
                <Badge className={`${statusColors[invoice.status]} mt-1`}>
                  {invoice.status}
                </Badge>
              )}
            </div>

            <div>
              <Label>Issue Date</Label>
              {editMode ? (
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              ) : (
                <p className="mt-1">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
              )}
            </div>

            <div>
              <Label>Due Date</Label>
              {editMode ? (
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              ) : (
                <p className="mt-1">{invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              {editMode && (
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-2">
                {formData.line_items?.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
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
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={`$${item.total.toFixed(2)}`}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="col-span-1">
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
            ) : (
              <div className="border rounded-lg divide-y">
                {invoice.line_items?.map((item, index) => (
                  <div key={index} className="p-3 flex justify-between">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-slate-500">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tax ({formData.tax_rate}%):</span>
              {editMode ? (
                <Input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-24 text-right"
                />
              ) : (
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Paid:</span>
                <span className="font-semibold">-${invoice.paid_amount.toFixed(2)}</span>
              </div>
            )}
            {editMode && (
              <div className="flex justify-between items-center">
                <Label>Paid Amount:</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.paid_amount || 0}
                  onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                  className="w-32 text-right"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
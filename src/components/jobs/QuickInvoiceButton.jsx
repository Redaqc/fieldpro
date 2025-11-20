import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuickInvoiceButton({ job }) {
  const [showPreview, setShowPreview] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generateInvoiceMutation = useMutation({
    mutationFn: async (jobData) => {
      // Calculate labor cost from time tracking
      const laborCost = (jobData.total_time_spent || 0) * (jobData.technicians?.[0]?.hourly_rate || 75);
      
      // Calculate material cost
      const materialCost = (jobData.material_usages || []).reduce((sum, u) => sum + u.total_cost, 0);
      
      // Build line items
      const lineItems = [];
      
      // Add job description as first line
      lineItems.push({
        description: jobData.title,
        quantity: 1,
        unit_price: 0,
        total: 0,
        type: 'title'
      });
      
      // Add labor
      if (jobData.total_time_spent > 0) {
        lineItems.push({
          description: `Labor - ${jobData.total_time_spent.toFixed(2)} hours`,
          quantity: jobData.total_time_spent,
          unit_price: jobData.technicians?.[0]?.hourly_rate || 75,
          total: laborCost,
          type: 'item'
        });
      }
      
      // Add materials
      (jobData.material_usages || []).forEach(usage => {
        lineItems.push({
          description: usage.material_name,
          quantity: usage.quantity,
          unit_price: usage.unit_cost,
          total: usage.total_cost,
          type: 'item'
        });
      });
      
      const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const tps = subtotal * 0.05; // 5% GST
      const tvq = subtotal * 0.09975; // 9.975% QST
      const total = subtotal + tps + tvq;
      
      const invoiceData = {
        job_id: jobData.id,
        customer_id: jobData.customer_id,
        customer_name: jobData.customer_name,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        line_items: lineItems,
        subtotal,
        tps,
        tvq,
        total,
        notes: `Invoice generated from Job #${jobData.job_number || jobData.id}`
      };
      
      return await base44.entities.Invoice.create(invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Invoice generated successfully!');
      setShowPreview(false);
    },
  });

  const handleGeneratePreview = async () => {
    setGenerating(true);
    try {
      // Calculate preview data
      const laborCost = (job.total_time_spent || 0) * 75;
      const materialCost = (job.material_usages || []).reduce((sum, u) => sum + u.total_cost, 0);
      const subtotal = laborCost + materialCost;
      const tps = subtotal * 0.05;
      const tvq = subtotal * 0.09975;
      const total = subtotal + tps + tvq;
      
      setInvoicePreview({
        laborCost,
        materialCost,
        subtotal,
        tps,
        tvq,
        total,
        laborHours: job.total_time_spent || 0,
        materials: job.material_usages || []
      });
      setShowPreview(true);
    } finally {
      setGenerating(false);
    }
  };

  if (job.status !== 'completed' && job.status !== 'review') {
    return null;
  }

  if (job.invoice_generated) {
    return (
      <Badge className="bg-green-500">
        <FileText className="w-3 h-3 mr-1" />
        Invoice Created
      </Badge>
    );
  }

  return (
    <>
      <Button
        onClick={handleGeneratePreview}
        disabled={generating}
        className="bg-green-600 hover:bg-green-700"
      >
        {generating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        Generate Invoice
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>

          {invoicePreview && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold mb-2">{job.customer_name}</h4>
                <p className="text-sm text-slate-600">{job.title}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Line Items:</h4>
                
                {invoicePreview.laborHours > 0 && (
                  <div className="flex justify-between text-sm p-2 bg-white rounded border">
                    <span>Labor ({invoicePreview.laborHours.toFixed(2)} hours @ $75/hr)</span>
                    <span className="font-medium">${invoicePreview.laborCost.toFixed(2)}</span>
                  </div>
                )}

                {invoicePreview.materials.map((m, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-white rounded border">
                    <span>{m.material_name} (×{m.quantity})</span>
                    <span className="font-medium">${m.total_cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${invoicePreview.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TPS (5%):</span>
                  <span>${invoicePreview.tps.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVQ (9.975%):</span>
                  <span>${invoicePreview.tvq.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${invoicePreview.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => generateInvoiceMutation.mutate(job)}
              disabled={generateInvoiceMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {generateInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
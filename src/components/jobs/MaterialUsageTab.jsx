import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MaterialUsageTab({ job }) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [newUsage, setNewUsage] = useState({
    material_id: '',
    quantity: 1,
    notes: ''
  });
  const queryClient = useQueryClient();

  /**
   * AUDIT FIX: High Priority Issue #14 - Lock Material Costs on Invoice
   * Prevent modification of materials after job is invoiced
   */
  const isJobInvoiced = job.invoice_generated || job.invoice_id;

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
    initialData: [],
  });

  const materialUsages = job.material_usages || [];

  const addUsageMutation = useMutation({
    mutationFn: async (usage) => {
      /**
       * AUDIT FIX: High Priority Issue #14 - Lock Material Costs on Invoice
       * Prevent adding materials after job is invoiced
       */
      if (isJobInvoiced) {
        throw new Error(
          'Cannot add materials: This job has already been invoiced. Material costs are locked to preserve invoice accuracy.'
        );
      }

      /**
       * AUDIT FIX: Critical Issue #4 - Inventory Quantity Validation
       * Prevent negative inventory by checking stock before assignment
       */
      const material = materials.find(m => m.id === usage.material_id);

      // VALIDATION: Check if sufficient inventory is available
      if (material.quantity < usage.quantity) {
        throw new Error(
          `Insufficient inventory: ${material.name} has only ${material.quantity} units available, but ${usage.quantity} units were requested.`
        );
      }

      const cost = material.unit_cost * usage.quantity;

      const updatedUsages = [
        ...materialUsages,
        {
          id: Date.now().toString(),
          material_id: usage.material_id,
          material_name: material.name,
          quantity: usage.quantity,
          unit_cost: material.unit_cost,
          total_cost: cost,
          notes: usage.notes,
          logged_at: new Date().toISOString(),
          logged_by: (await base44.auth.me()).email
        }
      ];

      // Update job with new material usages
      await base44.entities.Job.update(job.id, {
        material_usages: updatedUsages,
        activity_log: [
          ...(job.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            user: (await base44.auth.me()).email,
            action: 'material_added',
            details: `Added ${usage.quantity}x ${material.name}`
          }
        ]
      });

      // Decrement material inventory (now safe after validation)
      await base44.entities.Material.update(material.id, {
        quantity: material.quantity - usage.quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setAdding(false);
      setError(null);
      setNewUsage({ material_id: '', quantity: 1, notes: '' });
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const removeUsageMutation = useMutation({
    mutationFn: async (usageId) => {
      /**
       * AUDIT FIX: High Priority Issue #14 - Lock Material Costs on Invoice
       * Prevent removing materials after job is invoiced
       */
      if (isJobInvoiced) {
        throw new Error(
          'Cannot remove materials: This job has already been invoiced. Material costs are locked to preserve invoice accuracy.'
        );
      }

      const usage = materialUsages.find(u => u.id === usageId);
      const updatedUsages = materialUsages.filter(u => u.id !== usageId);

      await base44.entities.Job.update(job.id, {
        material_usages: updatedUsages
      });

      // Return materials to inventory
      const material = materials.find(m => m.id === usage.material_id);
      if (material) {
        await base44.entities.Material.update(material.id, {
          quantity: material.quantity + usage.quantity
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const totalMaterialCost = materialUsages.reduce((sum, u) => sum + (u.total_cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Materials Used</h3>
          <p className="text-sm text-slate-600">Track materials consumed on this job</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total Material Cost</p>
          <p className="text-2xl font-bold text-slate-900">${totalMaterialCost.toFixed(2)}</p>
        </div>
      </div>

      {/* AUDIT FIX: High Priority Issue #14 - Material Lock Warning */}
      {isJobInvoiced && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg flex items-start gap-2">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Material Costs Locked:</strong> This job has been invoiced. Material costs are locked to preserve invoice accuracy and prevent accounting errors.
          </div>
        </div>
      )}

      {/* Add Material Form */}
      {adding && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Material</label>
              <Select
                value={newUsage.material_id}
                onValueChange={(v) => setNewUsage({ ...newUsage, material_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} - ${m.unit_cost} ({m.quantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Quantity</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={newUsage.quantity}
                onChange={(e) => setNewUsage({ ...newUsage, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Input
                value={newUsage.notes}
                onChange={(e) => setNewUsage({ ...newUsage, notes: e.target.value })}
                placeholder="Location used, reason, etc."
              />
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setError(null);
                  addUsageMutation.mutate(newUsage);
                }}
                disabled={!newUsage.material_id || addUsageMutation.isPending}
                className="flex-1"
              >
                Add to Job
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                  setNewUsage({ material_id: '', quantity: 1, notes: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!adding && (
        <Button
          onClick={() => setAdding(true)}
          variant="outline"
          className="w-full"
          disabled={isJobInvoiced}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isJobInvoiced ? 'Materials Locked (Job Invoiced)' : 'Add Material Usage'}
        </Button>
      )}

      {/* Materials List */}
      <div className="space-y-2">
        {materialUsages.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">No materials used yet</p>
          </div>
        ) : (
          materialUsages.map((usage) => (
            <Card key={usage.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{usage.material_name}</h4>
                      <Badge variant="outline">{usage.quantity} units</Badge>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      ${usage.unit_cost} × {usage.quantity} = ${usage.total_cost.toFixed(2)}
                    </div>
                    {usage.notes && (
                      <p className="text-sm text-slate-500 mt-1">{usage.notes}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Logged {new Date(usage.logged_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Remove this material usage? Inventory will be restored.')) {
                        removeUsageMutation.mutate(usage.id);
                      }
                    }}
                    disabled={isJobInvoiced}
                    title={isJobInvoiced ? 'Cannot remove - job is invoiced' : 'Remove material'}
                  >
                    <Trash2 className={`w-4 h-4 ${isJobInvoiced ? 'text-slate-300' : 'text-red-600'}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
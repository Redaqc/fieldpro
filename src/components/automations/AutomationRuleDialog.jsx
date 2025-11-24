import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AutomationRuleDialog({ open, onClose, rule }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'alert_overdue',
    active: true,
    actions: [{ type: 'send_notification', config: {} }],
    schedule: { frequency: 'hourly' }
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (rule) {
      setFormData(rule);
    }
  }, [rule]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (rule?.id) {
        return base44.entities.Automation.update(rule.id, data);
      } else {
        return base44.entities.Automation.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Automation' : 'Create Automation Rule'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Rule Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Alert on Overdue Jobs"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label>Automation Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alert_overdue">Alert on Overdue Jobs</SelectItem>
                <SelectItem value="alert_low_stock">Alert on Low Stock</SelectItem>
                <SelectItem value="alert_technician_late">Alert Technician Late</SelectItem>
                <SelectItem value="auto_invoice">Auto-Generate Invoice</SelectItem>
                <SelectItem value="status_change">Auto Status Change</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Run Frequency</Label>
            <Select
              value={formData.schedule?.frequency || 'hourly'}
              onValueChange={(v) => setFormData({ 
                ...formData, 
                schedule: { ...formData.schedule, frequency: v } 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.name || saveMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {rule ? 'Update' : 'Create'} Rule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
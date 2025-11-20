import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecurringJobDialog({ open, onClose, template, customers, technicians }) {
  const [formData, setFormData] = useState({
    template_name: '',
    job_template: {
      title: '',
      description: '',
      customer_id: '',
      customer_name: '',
      duration_days: 1,
      technicians: []
    },
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      start_time: '09:00'
    },
    start_date: new Date().toISOString().split('T')[0],
    active: true
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (template?.id) {
        return base44.entities.RecurringJob.update(template.id, data);
      } else {
        return base44.entities.RecurringJob.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringJobs'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!formData.template_name || !formData.job_template.title) {
      alert('Please fill in required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Recurring Job' : 'Create Recurring Job'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Template Name *</Label>
            <Input
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              placeholder="e.g., Monthly HVAC Maintenance"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Job Details</h3>
            
            <div className="space-y-3">
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={formData.job_template.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    job_template: { ...formData.job_template, title: e.target.value }
                  })}
                  placeholder="Job title"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.job_template.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    job_template: { ...formData.job_template, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Customer</Label>
                <Select
                  value={formData.job_template.customer_id}
                  onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    setFormData({
                      ...formData,
                      job_template: {
                        ...formData.job_template,
                        customer_id: value,
                        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : ''
                      }
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.job_template.duration_days}
                  onChange={(e) => setFormData({
                    ...formData,
                    job_template: { ...formData.job_template, duration_days: parseInt(e.target.value) || 1 }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Recurrence Schedule</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.recurrence.frequency}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, frequency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Every</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.recurrence.interval}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, interval: parseInt(e.target.value) || 1 }
                  })}
                  placeholder="1"
                />
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.recurrence.start_time}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, start_time: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {template ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
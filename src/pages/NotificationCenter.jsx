import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function NotificationCenter() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'job_assigned',
    channel: 'email',
    email_subject: '',
    email_body: '',
    sms_body: '',
    recipient_type: 'customer',
    active: true,
    language: 'en'
  });
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: () => base44.entities.NotificationTemplate.list(),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (selectedTemplate?.id) {
        return base44.entities.NotificationTemplate.update(selectedTemplate.id, data);
      } else {
        return base44.entities.NotificationTemplate.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.NotificationTemplate.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      trigger: 'job_assigned',
      channel: 'email',
      email_subject: '',
      email_body: '',
      sms_body: '',
      recipient_type: 'customer',
      active: true,
      language: 'en'
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData(template);
    setDialogOpen(true);
  };

  const triggerLabels = {
    job_assigned: 'Job Assigned',
    job_completed: 'Job Completed',
    job_overdue: 'Job Overdue',
    invoice_sent: 'Invoice Sent',
    invoice_overdue: 'Invoice Overdue',
    payment_received: 'Payment Received',
    schedule_reminder: 'Schedule Reminder',
    maintenance_due: 'Maintenance Due'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notification Center</h1>
          <p className="text-slate-500 mt-1">Manage email and SMS notification templates</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className={template.active ? '' : 'opacity-60'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    {triggerLabels[template.trigger] || template.trigger}
                  </p>
                </div>
                <Switch
                  checked={template.active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: template.id, active: checked })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                {template.channel === 'email' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </Badge>
                )}
                {template.channel === 'sms' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    SMS
                  </Badge>
                )}
                {template.channel === 'both' && (
                  <>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      SMS
                    </Badge>
                  </>
                )}
              </div>

              <div className="text-xs text-slate-600">
                <span className="font-medium">To:</span> {template.recipient_type}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(template)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete this template?')) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg">
            <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No notification templates</h3>
            <p className="text-slate-500 mb-4">Create templates for automated notifications</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Notification Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Job Assignment Email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Trigger Event *</label>
                <Select value={formData.trigger} onValueChange={(v) => setFormData({ ...formData, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Channel *</label>
                <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="both">Email + SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recipient Type</label>
                <Select value={formData.recipient_type} onValueChange={(v) => setFormData({ ...formData, recipient_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Language</label>
                <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.channel === 'email' || formData.channel === 'both') && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Subject *</label>
                  <Input
                    value={formData.email_subject}
                    onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                    placeholder="Use {{variable}} for dynamic content"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Email Body *</label>
                  <Textarea
                    value={formData.email_body}
                    onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                    placeholder="HTML content with {{customer_name}}, {{job_title}}, etc."
                    rows={6}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Available variables: customer_name, job_title, technician_name, date, amount
                  </p>
                </div>
              </>
            )}

            {(formData.channel === 'sms' || formData.channel === 'both') && (
              <div>
                <label className="text-sm font-medium mb-1 block">SMS Message *</label>
                <Textarea
                  value={formData.sms_body}
                  onChange={(e) => setFormData({ ...formData, sms_body: e.target.value })}
                  placeholder="Keep it short (160 chars). Use {{variable}} syntax."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.sms_body.length}/160 characters
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.name || saveMutation.isPending}
                className="bg-blue-600"
              >
                {saveMutation.isPending ? 'Saving...' : (selectedTemplate ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
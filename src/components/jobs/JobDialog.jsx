import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function JobDialog({ open, onClose, job, onSave, customers, technicians }) {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    description: job?.description || '',
    status: job?.status || 'to_do',
    priority: job?.priority || 'medium',
    due_date: job?.due_date || '',
    customer_id: job?.customer_id || '',
    customer_name: job?.customer_name || '',
    assigned_to: job?.assigned_to || [],
    assigned_names: job?.assigned_names || [],
    labels: job?.labels || [],
    trello_card_ref: job?.trello_card_ref || '',
    location: job?.location || '',
    scheduled_date: job?.scheduled_date || '',
    scheduled_time: job?.scheduled_time || '',
    ...job,
  });

  const [newLabel, setNewLabel] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData({
        ...formData,
        labels: [...formData.labels, newLabel.trim()]
      });
      setNewLabel('');
    }
  };

  const removeLabel = (label) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter(l => l !== label)
    });
  };

  const handleTechnicianChange = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;

    const isSelected = formData.assigned_to.includes(techId);
    
    setFormData({
      ...formData,
      assigned_to: isSelected 
        ? formData.assigned_to.filter(id => id !== techId)
        : [...formData.assigned_to, techId],
      assigned_names: isSelected
        ? formData.assigned_names.filter(n => n !== `${tech.first_name} ${tech.last_name}`)
        : [...formData.assigned_names, `${tech.first_name} ${tech.last_name}`]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Job' : 'Create New Job'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Job Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter job title..."
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the job..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_do">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Customer</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(val) => {
                const customer = customers.find(c => c.id === val);
                setFormData({
                  ...formData,
                  customer_id: val,
                  customer_name: customer ? `${customer.first_name} ${customer.last_name}` : ''
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
            <Label>Assigned To</Label>
            <div className="border rounded-lg p-3 space-y-2">
              {technicians.map(tech => (
                <label key={tech.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assigned_to.includes(tech.id)}
                    onChange={() => handleTechnicianChange(tech.id)}
                    className="rounded"
                  />
                  <span>{tech.first_name} {tech.last_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Scheduled Time</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Labels/Tags</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.labels.map((label, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                  {label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeLabel(label)} />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add label..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
              />
              <Button type="button" onClick={addLabel} variant="outline">Add</Button>
            </div>
          </div>

          <div>
            <Label>Trello Card Reference</Label>
            <Input
              value={formData.trello_card_ref}
              onChange={(e) => setFormData({ ...formData, trello_card_ref: e.target.value })}
              placeholder="e.g., https://trello.com/c/..."
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Job location..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {job ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
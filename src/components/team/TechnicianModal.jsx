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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800"
};

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981',
  '#14b8a6', '#06b6d4', '#6366f1', '#a855f7', '#ef4444'
];

export default function TechnicianModal({ technician, jobs = [], onClose, onDelete }) {
  const queryClient = useQueryClient();
  const isNew = !technician;
  const [formData, setFormData] = useState(technician || {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: [],
    hourly_rate: "",
    status: "available",
    color: colorOptions[0]
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const submitData = {
        ...data,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
      };
      if (isNew) {
        return base44.entities.Technician.create(submitData);
      } else {
        return base44.entities.Technician.update(technician.id, submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const toggleSpecialization = (spec) => {
    const current = formData.specialization || [];
    if (current.includes(spec)) {
      setFormData({ 
        ...formData, 
        specialization: current.filter(s => s !== spec) 
      });
    } else {
      setFormData({ 
        ...formData, 
        specialization: [...current, spec] 
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isNew ? 'Add New Technician' : `${technician.first_name} ${technician.last_name}`}
            </DialogTitle>
            {!isNew && (
              <Button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this technician?')) {
                    onDelete();
                  }
                }}
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            {!isNew && <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Specialization</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['plumbing', 'electrical', 'hvac', 'carpentry', 'general', 'appliance_repair', 'landscaping', 'cleaning', 'painting'].map((spec) => (
                    <Button
                      key={spec}
                      type="button"
                      variant={formData.specialization?.includes(spec) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSpecialization(spec)}
                      className="capitalize"
                    >
                      {spec.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Calendar Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-slate-900 scale-110' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isNew ? 'Add Technician' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {!isNew && (
            <TabsContent value="jobs" className="mt-4">
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No jobs assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Link 
                      key={job.id}
                      to={createPageUrl("Jobs") + "?id=" + job.id}
                      className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900">{job.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{job.customer_name}</p>
                          {job.scheduled_date && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{format(new Date(job.scheduled_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                        <Badge className={statusColors[job.status]}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
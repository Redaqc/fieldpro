import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Trash2, MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  on_hold: "bg-gray-100 text-gray-800"
};

export default function JobDetailsModal({ job, customers, technicians, onClose, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(job);

  const handleSave = () => {
    const customer = customers.find(c => c.id === formData.customer_id);
    const technician = technicians.find(t => t.id === formData.technician_id);
    
    onUpdate({
      ...formData,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : formData.customer_name,
      technician_name: technician ? `${technician.first_name} ${technician.last_name}` : formData.technician_name,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
      actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : undefined,
    });
    setEditMode(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span>Job #{job.job_number || job.id.slice(0, 8)}</span>
              <Badge className={statusColors[job.status]}>
                {job.status.replace('_', ' ')}
              </Badge>
            </DialogTitle>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-1" />
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
                      if (confirm('Are you sure you want to delete this job?')) {
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

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label>Job Title</Label>
              {editMode ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              ) : (
                <p className="text-lg font-semibold mt-1">{job.title}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              {editMode ? (
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-slate-600 mt-1">{job.description || 'No description'}</p>
              )}
            </div>

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
                  <p className="font-medium mt-1">{job.customer_name}</p>
                )}
              </div>

              <div>
                <Label>Technician</Label>
                {editMode ? (
                  <Select 
                    value={formData.technician_id || ''}
                    onValueChange={(value) => setFormData({ ...formData, technician_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.first_name} {tech.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium mt-1">{job.technician_name || 'Not assigned'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Service Type</Label>
                {editMode ? (
                  <Select 
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="carpentry">Carpentry</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 capitalize">{job.service_type}</p>
                )}
              </div>

              <div>
                <Label>Priority</Label>
                {editMode ? (
                  <Select 
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
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
                ) : (
                  <p className="mt-1 capitalize">{job.priority}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Date</Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formData.scheduled_date || ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{job.scheduled_date ? format(new Date(job.scheduled_date), 'MMM d, yyyy') : 'Not scheduled'}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Scheduled Time</Label>
                {editMode ? (
                  <Input
                    type="time"
                    value={formData.scheduled_time || ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>{job.scheduled_time || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Location</Label>
              {editMode ? (
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{job.location || 'No location'}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Cost</Label>
                {editMode ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold">{job.estimated_cost ? `$${job.estimated_cost.toFixed(2)}` : 'Not set'}</span>
                  </div>
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
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`${statusColors[job.status]} mt-1`}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="completion" className="space-y-4 mt-4">
            <div>
              <Label>Actual Cost</Label>
              {editMode ? (
                <Input
                  type="number"
                  step="0.01"
                  value={formData.actual_cost || ''}
                  onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
                  placeholder="Final cost"
                />
              ) : (
                <p className="font-semibold text-lg mt-1">
                  {job.actual_cost ? `$${job.actual_cost.toFixed(2)}` : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <Label>Completion Notes</Label>
              {editMode ? (
                <Textarea
                  value={formData.completion_notes || ''}
                  onChange={(e) => setFormData({ ...formData, completion_notes: e.target.value })}
                  rows={4}
                  placeholder="Add completion notes..."
                />
              ) : (
                <p className="text-slate-600 mt-1">{job.completion_notes || 'No completion notes'}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div>
              <Label>Internal Notes</Label>
              {editMode ? (
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  placeholder="Add internal notes..."
                />
              ) : (
                <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                  {job.notes || 'No notes'}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
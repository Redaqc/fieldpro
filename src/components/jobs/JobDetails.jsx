import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuickInvoiceButton from "./QuickInvoiceButton";
import JobProfitabilityPanel from "../profitability/JobProfitabilityPanel";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  on_hold: "bg-gray-100 text-gray-800"
};

export default function JobDetails({ job, onClose, onEdit, onUpdate, onDelete, customers, technicians }) {
  const customer = customers.find(c => c.id === job.customer_id);
  const technician = technicians.find(t => t.id === job.technician_id);

  const handleStatusChange = (newStatus) => {
    onUpdate({ id: job.id, data: { ...job, status: newStatus } });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{job.title}</DialogTitle>
              <p className="text-sm text-slate-500">Job #{job.job_number}</p>
            </div>
            <div className="flex gap-2">
              <QuickInvoiceButton job={job} />
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this job?')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status */}
          <div>
            <Label className="text-sm font-medium text-slate-700">Status</Label>
            <Select value={job.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="mt-1">
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
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600">{job.description}</p>
            </div>
          )}

          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Job Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{job.service_type?.replace('_', ' ')}</Badge>
                  {job.priority && (
                    <Badge className={
                      job.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      job.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      job.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {job.priority} priority
                    </Badge>
                  )}
                </div>
                {job.scheduled_date && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(job.scheduled_date), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                {job.scheduled_time && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{job.scheduled_time} ({job.duration_minutes} min)</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cost */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Cost</h3>
              <div className="space-y-2">
                {job.estimated_cost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Estimate:</span>
                    <span className="font-semibold text-slate-900">
                      ${job.estimated_cost.toFixed(2)}
                    </span>
                  </div>
                )}
                {job.actual_cost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Actual:</span>
                    <span className="font-semibold text-green-600">
                      ${job.actual_cost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Customer</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">{customer.first_name} {customer.last_name}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technician Info */}
          {technician && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Assigned Technician</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: technician.color || '#64748b' }}
                  >
                    {technician.first_name[0]}{technician.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{technician.first_name} {technician.last_name}</p>
                    {technician.phone && (
                      <p className="text-sm text-slate-600">{technician.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-slate-600 bg-slate-50 rounded-lg p-4">{job.notes}</p>
            </div>
          )}

          {/* Completion Notes */}
          {job.completion_notes && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Completion Notes
              </h3>
              <p className="text-slate-600 bg-green-50 rounded-lg p-4">{job.completion_notes}</p>
            </div>
          )}

          {/* Profitability */}
          {(job.status === 'completed' || job.status === 'invoiced') && (
            <JobProfitabilityPanel job={job} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className }) {
  return <label className={`text-sm font-medium text-slate-700 ${className}`}>{children}</label>;
}
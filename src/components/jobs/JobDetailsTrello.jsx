import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Paperclip,
  CheckSquare,
  MessageSquare,
  FileText,
  Upload,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const labelColors = {
  scheduled: { bg: "bg-blue-500", text: "Scheduled" },
  in_progress: { bg: "bg-yellow-500", text: "In Progress" },
  urgent: { bg: "bg-red-500", text: "Urgent" },
  high: { bg: "bg-orange-500", text: "High Priority" },
  completed: { bg: "bg-green-500", text: "Completed" },
};

export default function JobDetailsTrello({ job, onClose, onUpdate, customers, technicians, currentUser }) {
  const [localJob, setLocalJob] = useState(job);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newInvoiceItem, setNewInvoiceItem] = useState({ description: "", quantity: 1, unit_price: 0 });
  const [newLog, setNewLog] = useState("");
  const [uploading, setUploading] = useState(false);

  const customer = customers.find(c => c.id === localJob.customer_id);
  const technician = technicians.find(t => t.id === localJob.technician_id);
  const isTechnician = currentUser?.role !== 'admin';

  const saveJob = (updatedData) => {
    const updated = { ...localJob, ...updatedData };
    setLocalJob(updated);
    onUpdate({ id: job.id, data: updated });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const checklist = [...(localJob.checklist || []), {
      id: Date.now().toString(),
      text: newChecklistItem,
      completed: false
    }];
    saveJob({ checklist });
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id) => {
    const checklist = localJob.checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveJob({ checklist });
  };

  const deleteChecklistItem = (id) => {
    const checklist = localJob.checklist.filter(item => item.id !== id);
    saveJob({ checklist });
  };

  const addInvoiceItem = () => {
    if (!newInvoiceItem.description.trim()) return;
    const invoice_items = [...(localJob.invoice_items || []), {
      ...newInvoiceItem,
      completed: false
    }];
    saveJob({ invoice_items });
    setNewInvoiceItem({ description: "", quantity: 1, unit_price: 0 });
  };

  const toggleInvoiceItem = (index) => {
    const invoice_items = localJob.invoice_items.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item
    );
    saveJob({ invoice_items });
  };

  const addLog = () => {
    if (!newLog.trim()) return;
    const technician_logs = [...(localJob.technician_logs || []), {
      note: newLog,
      timestamp: new Date().toISOString(),
      technician_name: currentUser?.full_name || 'Technician'
    }];
    saveJob({ technician_logs });
    setNewLog("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const attachments = [...(localJob.attachments || []), {
        name: file.name,
        url: file_url,
        uploaded_at: new Date().toISOString()
      }];
      saveJob({ attachments });
    } catch (error) {
      alert('Failed to upload file');
    }
    setUploading(false);
  };

  const deleteAttachment = (index) => {
    const attachments = localJob.attachments.filter((_, i) => i !== index);
    saveJob({ attachments });
  };

  const completedChecklist = (localJob.checklist || []).filter(i => i.completed).length;
  const totalChecklist = (localJob.checklist || []).length;
  const completedInvoice = (localJob.invoice_items || []).filter(i => i.completed).length;
  const totalInvoice = (localJob.invoice_items || []).length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-slate-50 p-0">
        <div className="grid grid-cols-[1fr_320px] h-[95vh]">
          {/* Main Content */}
          <div className="overflow-y-auto p-6 space-y-4">
            {/* Header with Labels */}
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-6 h-6 text-slate-600" />
                  <h2 className="text-2xl font-semibold text-slate-900">{localJob.title}</h2>
                </div>
              </DialogHeader>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {localJob.status && (
                  <Badge className={`${labelColors[localJob.status]?.bg || 'bg-slate-500'} text-white px-3 py-1`}>
                    {labelColors[localJob.status]?.text || localJob.status}
                  </Badge>
                )}
                {localJob.priority && localJob.priority !== 'medium' && (
                  <Badge className={`${labelColors[localJob.priority]?.bg || 'bg-slate-500'} text-white px-3 py-1`}>
                    {labelColors[localJob.priority]?.text || localJob.priority}
                  </Badge>
                )}
                {(localJob.labels || []).map((label, i) => (
                  <Badge key={i} className="bg-purple-500 text-white px-3 py-1">{label}</Badge>
                ))}
              </div>

              <p className="text-sm text-slate-500">in {customer?.company_name || `${customer?.first_name} ${customer?.last_name}`}</p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Description</h3>
              </div>
              <p className="text-slate-700">{localJob.description || 'No description provided'}</p>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Checklist</h3>
                  {totalChecklist > 0 && (
                    <span className="text-sm text-slate-500">
                      {completedChecklist}/{totalChecklist}
                    </span>
                  )}
                </div>
              </div>
              
              {totalChecklist > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-3">
                {(localJob.checklist || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded group">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => deleteChecklistItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add an item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                  className="flex-1"
                />
                <Button onClick={addChecklistItem} size="sm">Add</Button>
              </div>
            </div>

            {/* Invoice Items (Technician View - No Prices) */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Items to Invoice</h3>
                  {totalInvoice > 0 && (
                    <span className="text-sm text-slate-500">
                      {completedInvoice}/{totalInvoice} completed
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {(localJob.invoice_items || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleInvoiceItem(index)}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.description}
                      </p>
                      <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                      {!isTechnician && (
                        <p className="text-sm text-green-600 font-semibold">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isTechnician && (
                <div className="space-y-2">
                  <Input
                    placeholder="Item description"
                    value={newInvoiceItem.description}
                    onChange={(e) => setNewInvoiceItem({ ...newInvoiceItem, description: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newInvoiceItem.quantity}
                      onChange={(e) => setNewInvoiceItem({ ...newInvoiceItem, quantity: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={newInvoiceItem.unit_price}
                      onChange={(e) => setNewInvoiceItem({ ...newInvoiceItem, unit_price: parseFloat(e.target.value) })}
                      className="w-32"
                      step="0.01"
                    />
                    <Button onClick={addInvoiceItem} size="sm">Add Item</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Attachments</h3>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button size="sm" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </label>
              </div>

              <div className="space-y-2">
                {(localJob.attachments || []).map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded group">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 flex-1 hover:text-blue-600"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(file.uploaded_at), 'MMM d, HH:mm')}
                      </span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => deleteAttachment(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="bg-white border-l border-slate-200 overflow-y-auto p-4 space-y-4">
            {/* Quick Info */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Details</h4>
              <div className="space-y-3 text-sm">
                {localJob.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{format(new Date(localJob.scheduled_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {localJob.scheduled_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{localJob.scheduled_time}</span>
                  </div>
                )}
                {technician && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{technician.first_name} {technician.last_name}</span>
                  </div>
                )}
                {localJob.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-700 text-xs">{localJob.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Technician Notes */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Activity</h4>
              
              <div className="mb-3">
                <Textarea
                  placeholder="Write a note..."
                  value={newLog}
                  onChange={(e) => setNewLog(e.target.value)}
                  rows={3}
                  className="text-sm mb-2"
                />
                <Button onClick={addLog} size="sm" className="w-full">Add Note</Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(localJob.technician_logs || []).slice().reverse().map((log, index) => (
                  <div key={index} className="bg-slate-50 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">{log.technician_name}</span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{log.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
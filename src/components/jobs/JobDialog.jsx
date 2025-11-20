import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, CheckSquare, MessageSquare, Activity, Paperclip, Upload, Trash2, FileText, DollarSign, Palette, Play, CheckCircle, Clock, List, StopCircle, TrendingDown, GitBranch, Flag, BarChart } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import InvoicingTab from "./InvoicingTab";
import CostsTab from "./CostsTab";
import TaskDependenciesTab from "./TaskDependenciesTab";
import MilestonesTab from "./MilestonesTab";
import GanttChart from "./GanttChart";

export default function JobDialog({ open, onClose, job, technicians, currentUser, workTypes = [], customers = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    due_date: '',
    priority: 'medium',
    technicians: [],
    start_date: '',
    total_time_spent: 0,
    work_type_id: '',
    work_type_name: '',
    work_type_color: '',
    labels: [],
    checklist: [],
    milestones: [],
    comments: [],
    activity_log: [],
    attachments: [],
    project_addresses: [],
  });

  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3b82f6' });
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const labelColors = [
    { color: '#3b82f6', name: 'Bleu' },
    { color: '#ef4444', name: 'Rouge' },
    { color: '#10b981', name: 'Vert' },
    { color: '#f59e0b', name: 'Orange' },
    { color: '#8b5cf6', name: 'Violet' },
    { color: '#ec4899', name: 'Rose' },
    { color: '#14b8a6', name: 'Turquoise' },
    { color: '#f97316', name: 'Orange foncé' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#84cc16', name: 'Lime' },
    { color: '#6366f1', name: 'Indigo' },
    { color: '#f43f5e', name: 'Rose foncé' }
  ];

  const queryClient = useQueryClient();

  const currentTech = technicians.find(t => t.email === currentUser?.email);
  const isAdminOrManager = currentUser?.role === 'admin' || currentTech?.role === 'admin' || currentTech?.role === 'manager';

  const { data: checklistTemplates = [] } = useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: () => base44.entities.ChecklistTemplate.list(),
    initialData: [],
  });

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        technicians: job.technicians || [],
        labels: job.labels || [],
        checklist: job.checklist || [],
        milestones: job.milestones || [],
        comments: job.comments || [],
        activity_log: job.activity_log || [],
        attachments: job.attachments || [],
        start_date: job.start_date || '',
        total_time_spent: job.total_time_spent || 0,
        project_addresses: job.project_addresses || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        due_date: '',
        priority: 'medium',
        technicians: [],
        start_date: '',
        total_time_spent: 0,
        work_type_id: '',
        work_type_name: '',
        work_type_color: '',
        labels: [],
        checklist: [],
        milestones: [],
        comments: [],
        activity_log: [],
        attachments: [],
        project_addresses: [],
      });
    }
    setNewLabel({ name: '', color: '#3b82f6' });
  }, [job, open]);

  const createJobMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onClose();
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      job_number: formData.job_number || `JOB-${Date.now()}`,
    };

    if (job) {
      updateJobMutation.mutate({ id: job.id, data: dataToSave });
    } else {
      const activity = [{
        timestamp: new Date().toISOString(),
        user: currentUser?.email || 'System',
        action: 'created',
        details: 'Job créé',
      }];
      createJobMutation.mutate({ ...dataToSave, activity_log: activity });
    }
  };

  const addLabel = () => {
    if (!newLabel.name.trim()) return;
    
    const updatedLabels = [...(formData.labels || []), newLabel];
    setFormData({ ...formData, labels: updatedLabels });
    setNewLabel({ name: '', color: '#3b82f6' });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { labels: updatedLabels },
      });
    }
  };

  const removeLabel = (index) => {
    const updatedLabels = formData.labels.filter((_, idx) => idx !== index);
    setFormData({ ...formData, labels: updatedLabels });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { labels: updatedLabels },
      });
    }
  };

  const deleteChecklistItem = (groupId, itemId) => {
    const updatedChecklist = formData.checklist.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.filter(item => item.id !== itemId),
        };
      }
      return group;
    });

    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { checklist: updatedChecklist },
      });
    }
  };



  const addChecklistGroup = () => {
    const newGroup = {
      id: `group_${Date.now()}`,
      name: 'Nouvelle checklist',
      items: [],
    };
    const updatedChecklist = [...formData.checklist, newGroup];
    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { checklist: updatedChecklist },
      });
    }
  };

  const applyChecklistTemplate = (templateId) => {
    const template = checklistTemplates.find(t => t.id === templateId);
    if (!template?.checklist_data) return;

    const newChecklists = template.checklist_data.map(group => ({
      id: `group_${Date.now()}_${Math.random()}`,
      name: group.name,
      items: (group.items || []).map(item => ({
        id: `item_${Date.now()}_${Math.random()}`,
        text: item.text,
        completed: false,
      })),
    }));

    const updatedChecklist = [...formData.checklist, ...newChecklists];
    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { checklist: updatedChecklist },
      });
    }
  };

  const deleteChecklistGroup = (groupId) => {
    const updatedChecklist = formData.checklist.filter(group => group.id !== groupId);
    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { checklist: updatedChecklist },
      });
    }
  };

  const addChecklistItem = (groupId) => {
    const itemText = prompt('Nouvel élément:');
    if (!itemText) return;

    const updatedChecklist = formData.checklist.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: [
            ...(group.items || []),
            {
              id: `item_${Date.now()}`,
              text: itemText,
              completed: false,
            },
          ],
        };
      }
      return group;
    });

    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { checklist: updatedChecklist },
      });
    }
  };

  const toggleChecklistItem = (groupId, itemId) => {
    const updatedChecklist = formData.checklist.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                completed: !item.completed,
                completed_at: !item.completed ? new Date().toISOString() : null,
                completed_by: !item.completed ? currentUser?.email : null,
              };
            }
            return item;
          }),
        };
      }
      return group;
    });

    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { checklist: updatedChecklist },
      });
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const newCommentObj = {
      id: `comment_${Date.now()}`,
      text: newComment,
      created_at: new Date().toISOString(),
      created_by: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
    };

    const updatedComments = [newCommentObj, ...(formData.comments || [])];
    setFormData({ ...formData, comments: updatedComments });
    setNewComment('');
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { comments: updatedComments },
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPendingFile(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setNewFileName(nameWithoutExt);
    setRenameDialogOpen(true);
    e.target.value = '';
  };

  const confirmFileUpload = async () => {
    if (!pendingFile) return;

    setRenameDialogOpen(false);
    setUploadingFile(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
      
      const fileExt = pendingFile.name.split('.').pop();
      const finalName = newFileName.trim() ? `${newFileName.trim()}.${fileExt}` : pendingFile.name;
      
      const newAttachment = {
        name: finalName,
        url: file_url,
        uploaded_at: new Date().toISOString(),
        uploaded_by: currentUser?.email,
      };

      const updatedAttachments = [...(formData.attachments || []), newAttachment];
      setFormData({ ...formData, attachments: updatedAttachments });
      
      if (job) {
        updateJobMutation.mutate({
          id: job.id,
          data: { attachments: updatedAttachments },
        });
      }
    } catch (error) {
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
      setPendingFile(null);
      setNewFileName('');
    }
  };



  const getChecklistProgress = () => {
    const allItems = formData.checklist.flatMap(group => group.items || []);
    const completed = allItems.filter(item => item.completed).length;
    return { completed, total: allItems.length };
  };

  const handleQuickStatus = (newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'in_progress' && !formData.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    setFormData({ ...formData, ...updates });
    
    if (job) {
      updateJobMutation.mutate({ id: job.id, data: updates });
    }
  };

  const toggleTechnician = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;
    
    const currentTechs = formData.technicians || [];
    const exists = currentTechs.find(t => t.id === techId);
    
    let updatedTechs;
    if (exists) {
      updatedTechs = currentTechs.filter(t => t.id !== techId);
    } else {
      updatedTechs = [...currentTechs, { 
        id: tech.id, 
        name: `${tech.first_name} ${tech.last_name}`,
        time_spent: 0,
        time_logs: []
      }];
    }
    
    setFormData({ ...formData, technicians: updatedTechs });
    
    if (job) {
      updateJobMutation.mutate({ id: job.id, data: { technicians: updatedTechs } });
    }
  };

  const startTimer = (techId) => {
    const updatedTechs = (formData.technicians || []).map(t => {
      if (t.id === techId) {
        return {
          ...t,
          active_start: new Date().toISOString()
        };
      }
      return t;
    });
    
    setFormData({ ...formData, technicians: updatedTechs });
    
    if (job) {
      updateJobMutation.mutate({ id: job.id, data: { technicians: updatedTechs } });
    }
  };

  const stopTimer = (techId) => {
    const updatedTechs = (formData.technicians || []).map(t => {
      if (t.id === techId && t.active_start) {
        const start = new Date(t.active_start);
        const end = new Date();
        const duration = (end - start) / (1000 * 60 * 60); // heures
        
        const newLog = {
          start: t.active_start,
          end: end.toISOString(),
          duration: parseFloat(duration.toFixed(2))
        };
        
        return {
          ...t,
          time_spent: (t.time_spent || 0) + parseFloat(duration.toFixed(2)),
          time_logs: [...(t.time_logs || []), newLog],
          active_start: null
        };
      }
      return t;
    });
    
    // Calculer le total
    const totalTime = updatedTechs.reduce((sum, t) => sum + (t.time_spent || 0), 0);
    
    setFormData({ ...formData, technicians: updatedTechs, total_time_spent: parseFloat(totalTime.toFixed(2)) });
    
    if (job) {
      updateJobMutation.mutate({ 
        id: job.id, 
        data: { 
          technicians: updatedTechs,
          total_time_spent: parseFloat(totalTime.toFixed(2))
        } 
      });
    }
  };

  const progress = getChecklistProgress();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl">{job ? 'Modifier le job' : 'Nouveau job'}</DialogTitle>
            {job && (
              <div className="flex gap-2">
                {formData.status !== 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => handleQuickStatus('in_progress')}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Démarrer
                  </Button>
                )}
                {formData.status !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => handleQuickStatus('completed')}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Terminer
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label className="text-sm font-medium">Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre du job"
              className="mt-1 h-11 text-base"
            />
          </div>

          {/* Customer */}
          <div>
            <Label className="text-sm font-medium">Client</Label>
            <Select 
              value={formData.customer_id || ''} 
              onValueChange={(value) => {
                const customer = customers.find(c => c.id === value);
                setFormData({ 
                  ...formData, 
                  customer_id: value,
                  customer_name: customer ? `${customer.first_name} ${customer.last_name}` : ''
                });
              }}
            >
              <SelectTrigger className="mt-1 h-11">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} {customer.company_name && `- ${customer.company_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée..."
              rows={4}
              className="mt-1 text-base"
            />
          </div>

          {/* Project Addresses */}
          <div className="space-y-3 border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Adresses du projet</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const addresses = [...(formData.project_addresses || []), ''];
                  setFormData({ ...formData, project_addresses: addresses });
                }}
                className="h-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {(formData.project_addresses || []).map((address, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={address}
                  onChange={(e) => {
                    const addresses = [...(formData.project_addresses || [])];
                    addresses[index] = e.target.value;
                    setFormData({ ...formData, project_addresses: addresses });
                  }}
                  placeholder={`Adresse ${index + 1}...`}
                  className="h-10 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const addresses = formData.project_addresses.filter((_, i) => i !== index);
                    setFormData({ ...formData, project_addresses: addresses });
                  }}
                  className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <Label className="text-sm font-medium">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="review">En révision</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-sm font-medium">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Work Type */}
            <div>
              <Label className="text-sm font-medium">Type de projet</Label>
              <Select 
                value={formData.work_type_id} 
                onValueChange={(value) => {
                  const type = workTypes.find(t => t.id === value);
                  setFormData({ 
                    ...formData, 
                    work_type_id: value,
                    work_type_name: type?.label_fr || type?.name || '',
                    work_type_color: type?.color || '#0074D9'
                  });
                }}
              >
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color || '#0074D9' }} />
                        {type.label_fr || type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <Label className="text-sm font-medium">Date d'échéance</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-1 h-11"
              />
            </div>

            {/* Start Date */}
            <div>
              <Label className="text-sm font-medium">Date de début</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1 h-11"
              />
            </div>

            {/* Time Spent */}
            {job && (
              <div className="col-span-2">
                <Label className="text-sm font-medium">Temps passé par technicien</Label>
                <div className="mt-1 space-y-2 border rounded-lg p-3 bg-slate-50 max-h-64 overflow-y-auto">
                  {(formData.technicians || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-2">Aucun technicien assigné</p>
                  ) : (
                    (formData.technicians || []).map(assignedTech => {
                      const tech = technicians.find(t => t.id === assignedTech.id);
                      if (!tech) return null;
                      return (
                        <div key={assignedTech.id} className="border rounded-lg p-2 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: tech.color || '#64748b' }}
                              >
                                {tech.first_name[0]}{tech.last_name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{tech.first_name} {tech.last_name}</p>
                                <p className="text-xs text-slate-500">{assignedTech.time_spent || 0}h</p>
                              </div>
                            </div>
                            {(tech.email === currentUser?.email || currentUser?.role === 'admin') && (
                              assignedTech.active_start ? (
                                <Button
                                  size="sm"
                                  onClick={() => stopTimer(assignedTech.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  <StopCircle className="w-3 h-3 mr-1" />
                                  Arrêter
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => startTimer(assignedTech.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Démarrer
                                </Button>
                              )
                            )}
                          </div>
                          {assignedTech.time_logs && assignedTech.time_logs.length > 0 && (
                            <div className="pt-2 border-t space-y-1">
                              <p className="text-xs font-medium text-slate-600">Historique:</p>
                              {assignedTech.time_logs.slice(-3).reverse().map((log, idx) => (
                                <div key={idx} className="text-xs text-slate-500 flex justify-between bg-slate-50 p-1 rounded">
                                  <span>{format(new Date(log.start), 'dd/MM HH:mm', { locale: fr })} → {format(new Date(log.end), 'HH:mm', { locale: fr })}</span>
                                  <span className="font-medium">{log.duration}h</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div className="pt-2 border-t mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Total:</span>
                      <span className="text-base font-bold text-blue-600">{formData.total_time_spent || 0}h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Technicians Assignment */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Techniciens assignés</Label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 flex-wrap">
                  {(formData.technicians || []).map(assignedTech => {
                    const tech = technicians.find(t => t.id === assignedTech.id);
                    if (!tech) return null;
                    return (
                      <div 
                        key={assignedTech.id}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: tech.color || '#64748b' }}
                        title={`${tech.first_name} ${tech.last_name}`}
                      >
                        {tech.first_name[0]}{tech.last_name[0]}
                      </div>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="w-10 h-10 rounded-full"
                    type="button"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">Techniciens assignés</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {technicians.map(tech => {
                      const isAssigned = (formData.technicians || []).find(t => t.id === tech.id);
                      return (
                        <div key={tech.id} className="border rounded-lg p-3 space-y-2">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => !isAssigned && toggleTechnician(tech.id)}
                          >
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: tech.color || '#64748b' }}
                            >
                              {tech.first_name[0]}{tech.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{tech.first_name} {tech.last_name}</p>
                              {isAssigned && (
                                <p className="text-xs text-slate-500">{isAssigned.time_spent || 0}h passées</p>
                              )}
                            </div>
                            {isAssigned ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTechnician(tech.id);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            ) : (
                              <Plus className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </div>

                          {isAssigned && (tech.email === currentUser?.email || currentUser?.role === 'admin') && (
                            <div className="flex gap-2 pl-11">
                              {isAssigned.active_start ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    stopTimer(tech.id);
                                  }}
                                  className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                >
                                  <StopCircle className="w-3 h-3 mr-1" />
                                  Arrêter
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startTimer(tech.id);
                                  }}
                                  className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Démarrer
                                </Button>
                              )}
                            </div>
                          )}

                          {isAssigned && isAssigned.time_logs && isAssigned.time_logs.length > 0 && (
                            <div className="pl-11 space-y-1">
                              <p className="text-xs font-medium text-slate-600">Historique:</p>
                              {isAssigned.time_logs.slice(-3).map((log, idx) => (
                                <div key={idx} className="text-xs text-slate-500 flex justify-between">
                                  <span>{format(new Date(log.start), 'dd/MM HH:mm', { locale: fr })}</span>
                                  <span className="font-medium">{log.duration}h</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Labels */}
          <div>
            <Label className="text-sm font-medium">Labels</Label>
            {formData.labels?.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3 mt-2">
                {formData.labels.map((label, idx) => (
                  <Badge 
                    key={idx} 
                    className="gap-2 pr-1 text-white shadow-sm"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:bg-white/20 rounded transition-colors" 
                      onClick={() => removeLabel(idx)} 
                    />
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-center mt-2">
              <Input
                value={newLabel.name}
                onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                placeholder="Nom du label..."
                className="flex-1 h-11 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLabel();
                  }
                }}
              />
              <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-11 px-4 gap-2"
                    type="button"
                  >
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: newLabel.color }}
                    />
                    <Palette className="w-4 h-4 text-slate-600" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 mb-3">Choisir une couleur</p>
                    <div className="grid grid-cols-4 gap-2">
                      {labelColors.map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          className={`h-10 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center ${
                            newLabel.color === item.color 
                              ? 'border-slate-900 ring-2 ring-slate-300 scale-105' 
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                          style={{ backgroundColor: item.color }}
                          onClick={() => {
                            setNewLabel({ ...newLabel, color: item.color });
                            setColorPopoverOpen(false);
                          }}
                          title={item.name}
                        >
                          {newLabel.color === item.color && (
                            <CheckSquare className="w-4 h-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={addLabel} 
                size="sm" 
                className="h-11 px-4 bg-blue-600 hover:bg-blue-700" 
                disabled={!newLabel.name.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>

          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className={`grid w-full h-auto ${isAdminOrManager ? 'grid-cols-3 sm:grid-cols-9' : 'grid-cols-3 sm:grid-cols-8'}`}>
              <TabsTrigger value="checklist" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <CheckSquare className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Checklist</span>
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <GitBranch className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Dépendances</span>
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <Flag className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Jalons</span>
              </TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <BarChart className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Gantt</span>
              </TabsTrigger>
              <TabsTrigger value="invoicing" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Facturation</span>
              </TabsTrigger>
              {isAdminOrManager && (
                <TabsTrigger value="costs" className="flex items-center gap-1 sm:gap-2 py-2.5">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Coûts</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="attachments" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <Paperclip className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Fichiers ({formData.attachments?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Commentaires ({formData.comments?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <Activity className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Activité</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="space-y-3">
              {progress.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression</span>
                    <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {formData.checklist.map(group => (
                <div key={group.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <Input
                      value={group.name}
                      onChange={(e) => {
                        const updatedChecklist = formData.checklist.map(g => 
                          g.id === group.id ? { ...g, name: e.target.value } : g
                        );
                        setFormData({ ...formData, checklist: updatedChecklist });
                        if (job) {
                          updateJobMutation.mutate({ id: job.id, data: { checklist: updatedChecklist } });
                        }
                      }}
                      className="font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 flex-1"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => addChecklistItem(group.id)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteChecklistGroup(group.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(group.items || []).map(item => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(group.id, item.id)}
                          className="w-4 h-4"
                        />
                        <span className={`flex-1 ${item.completed ? 'line-through text-slate-500' : ''}`}>
                          {item.text}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteChecklistItem(group.id, item.id)}
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={addChecklistGroup} variant="outline" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle checklist
                </Button>
                <Select onValueChange={applyChecklistTemplate}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Modèle de checklist" />
                  </SelectTrigger>
                  <SelectContent>
                    {checklistTemplates.filter(t => t.active !== false).length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Aucun modèle disponible
                      </div>
                    ) : (
                      checklistTemplates.filter(t => t.active !== false).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <List className="w-4 h-4" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="dependencies" className="space-y-4">
              <TaskDependenciesTab 
                formData={formData}
                setFormData={setFormData}
                job={job}
                updateJobMutation={updateJobMutation}
                technicians={technicians}
              />
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              <MilestonesTab 
                formData={formData}
                setFormData={setFormData}
                job={job}
                updateJobMutation={updateJobMutation}
              />
            </TabsContent>

            <TabsContent value="gantt" className="space-y-4">
              <GanttChart 
                job={formData}
                technicians={technicians}
              />
            </TabsContent>

            <TabsContent value="invoicing" className="space-y-4">
              <InvoicingTab 
                job={job}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>

            {isAdminOrManager && (
              <TabsContent value="costs" className="space-y-4">
                <CostsTab 
                  job={job}
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>
            )}

            <TabsContent value="attachments" className="space-y-3">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      {uploadingFile ? 'Upload en cours...' : 'Cliquez pour uploader un fichier'}
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploadingFile}
                  />
                </Label>
              </div>

              {formData.attachments?.map((attachment, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{attachment.name}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(attachment.uploaded_at), 'PPp', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(attachment.url, '_blank')}>
                      Voir
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  rows={2}
                />
                <Button onClick={addComment}>
                  Envoyer
                </Button>
              </div>

              {formData.comments?.map(comment => (
                <div key={comment.id} className="border-l-2 border-blue-500 pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{comment.user_name}</span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(comment.created_at), 'PPp', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{comment.text}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="activity" className="space-y-2">
              {formData.activity_log?.map((activity, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="text-slate-500">
                    {format(new Date(activity.timestamp), 'PPp', { locale: fr })}
                  </span>
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-slate-600">{activity.details}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="h-11 text-base">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.title} className="h-11 text-base">
              {job ? 'Sauvegarder' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Rename File Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer le fichier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du fichier</Label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Nom du fichier..."
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmFileUpload();
                  }
                }}
              />
              {pendingFile && (
                <p className="text-xs text-slate-500 mt-1">
                  Extension: .{pendingFile.name.split('.').pop()}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={confirmFileUpload}>
                Uploader
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
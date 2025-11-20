import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, CheckSquare, MessageSquare, Activity, Paperclip, Upload, Trash2, FileText, DollarSign, Palette } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function JobDialog({ open, onClose, job, technicians, currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    due_date: '',
    priority: 'medium',
    technician_id: '',
    technician_name: '',
    labels: [],
    checklist: [],
    comments: [],
    activity_log: [],
    attachments: [],
  });

  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3b82f6' });
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  
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

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        labels: job.labels || [],
        checklist: job.checklist || [],
        comments: job.comments || [],
        activity_log: job.activity_log || [],
        attachments: job.attachments || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        due_date: '',
        priority: 'medium',
        technician_id: '',
        technician_name: '',
        labels: [],
        checklist: [],
        comments: [],
        activity_log: [],
        attachments: [],
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newAttachment = {
        name: file.name,
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
    }
  };



  const getChecklistProgress = () => {
    const allItems = formData.checklist.flatMap(group => group.items || []);
    const completed = allItems.filter(item => item.completed).length;
    return { completed, total: allItems.length };
  };

  const progress = getChecklistProgress();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{job ? 'Modifier le job' : 'Nouveau job'}</DialogTitle>
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

            {/* Technician */}
            <div>
              <Label className="text-sm font-medium">Technicien assigné</Label>
              <Select 
                value={formData.technician_id} 
                onValueChange={(value) => {
                  const tech = technicians.find(t => t.id === value);
                  setFormData({ 
                    ...formData, 
                    technician_id: value,
                    technician_name: tech ? `${tech.first_name} ${tech.last_name}` : ''
                  });
                }}
              >
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto">
              <TabsTrigger value="checklist" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <CheckSquare className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Checklist</span>
              </TabsTrigger>
              <TabsTrigger value="invoicing" className="flex items-center gap-1 sm:gap-2 py-2.5">
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Facturation</span>
              </TabsTrigger>
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
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{group.name}</h4>
                    <Button size="sm" variant="outline" onClick={() => addChecklistItem(group.id)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter
                    </Button>
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
              <Button onClick={addChecklistGroup} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle checklist
              </Button>
            </TabsContent>

            <TabsContent value="invoicing" className="space-y-3">
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">Informations de facturation</p>
                <div className="space-y-3 max-w-md mx-auto">
                  <div>
                    <Label className="text-sm font-medium">Montant estimé</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Notes de facturation</Label>
                    <Textarea
                      placeholder="Notes additionnelles pour la facture..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Créer une facture pour ce job
                  </Button>
                </div>
              </div>
            </TabsContent>

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
                    onChange={handleFileUpload}
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
    </Dialog>
  );
}
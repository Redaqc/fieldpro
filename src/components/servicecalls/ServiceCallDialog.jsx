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
import { X, Plus, CheckSquare, MessageSquare, Activity, Paperclip, Upload, Play, CheckCircle, StopCircle, Palette } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ServiceCallDialog({ open, onClose, call, technicians, currentUser, workTypes = [], customers = [] }) {
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
    comments: [],
    activity_log: [],
    attachments: [],
    project_addresses: [],
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
  ];

  const queryClient = useQueryClient();

  const { data: checklistTemplates = [] } = useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: () => base44.entities.ChecklistTemplate.list(),
    initialData: [],
  });

  useEffect(() => {
    if (call) {
      setFormData({
        ...call,
        technicians: call.technicians || [],
        labels: call.labels || [],
        checklist: call.checklist || [],
        comments: call.comments || [],
        activity_log: call.activity_log || [],
        attachments: call.attachments || [],
        start_date: call.start_date || '',
        total_time_spent: call.total_time_spent || 0,
        project_addresses: call.project_addresses || [],
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
        comments: [],
        activity_log: [],
        attachments: [],
        project_addresses: [],
      });
    }
    setNewLabel({ name: '', color: '#3b82f6' });
  }, [call, open]);

  const createCallMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
      onClose();
    },
  });

  const updateCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceCall.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
    },
  });

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      call_number: formData.call_number || `CALL-${Date.now()}`,
    };

    if (call) {
      updateCallMutation.mutate({ id: call.id, data: dataToSave });
    } else {
      const activity = [{
        timestamp: new Date().toISOString(),
        user: currentUser?.email || 'System',
        action: 'created',
        details: 'Appel créé',
      }];
      createCallMutation.mutate({ ...dataToSave, activity_log: activity });
    }
  };

  const addLabel = () => {
    if (!newLabel.name.trim()) return;
    
    const updatedLabels = [...(formData.labels || []), newLabel];
    setFormData({ ...formData, labels: updatedLabels });
    setNewLabel({ name: '', color: '#3b82f6' });
    
    if (call) {
      updateCallMutation.mutate({
        id: call.id,
        data: { labels: updatedLabels },
      });
    }
  };

  const removeLabel = (index) => {
    const updatedLabels = formData.labels.filter((_, idx) => idx !== index);
    setFormData({ ...formData, labels: updatedLabels });
    
    if (call) {
      updateCallMutation.mutate({
        id: call.id,
        data: { labels: updatedLabels },
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
    
    if (call) {
      updateCallMutation.mutate({
        id: call.id,
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
    
    if (call) {
      updateCallMutation.mutate({
        id: call.id,
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
    
    if (call) {
      updateCallMutation.mutate({
        id: call.id,
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
    
    if (call) {
      updateCallMutation.mutate({
        id: call.id,
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
      
      if (call) {
        updateCallMutation.mutate({
          id: call.id,
          data: { attachments: updatedAttachments },
        });
      }
    } catch (error) {
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
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
    
    if (call) {
      updateCallMutation.mutate({ id: call.id, data: { technicians: updatedTechs } });
    }
  };

  const handleQuickStatus = (newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'in_progress' && !formData.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    setFormData({ ...formData, ...updates });
    
    if (call) {
      updateCallMutation.mutate({ id: call.id, data: updates });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{call ? 'Modifier l\'appel' : 'Nouvel appel'}</DialogTitle>
            {call && (
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
          <div>
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'appel"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Client</Label>
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
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="review">En révision</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="mt-1">
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

            <div>
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Type de service</Label>
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
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label_fr || type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Techniciens assignés</Label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 flex-wrap">
                  {(formData.technicians || []).map(assignedTech => {
                    const tech = technicians.find(t => t.id === assignedTech.id);
                    if (!tech) return null;
                    return (
                      <div 
                        key={assignedTech.id}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer"
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
                  <h3 className="font-semibold">Assigner techniciens</h3>
                  <div className="space-y-2">
                    {technicians.map(tech => {
                      const isAssigned = (formData.technicians || []).find(t => t.id === tech.id);
                      return (
                        <div 
                          key={tech.id} 
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                          onClick={() => toggleTechnician(tech.id)}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: tech.color || '#64748b' }}
                          >
                            {tech.first_name[0]}{tech.last_name[0]}
                          </div>
                          <span className="flex-1">{tech.first_name} {tech.last_name}</span>
                          {isAssigned && <CheckSquare className="w-4 h-4 text-green-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Tabs defaultValue="checklist" className="w-full">
            <TabsList>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="attachments">Fichiers</TabsTrigger>
              <TabsTrigger value="comments">Commentaires</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="space-y-3">
              {formData.checklist.map(group => (
                <div key={group.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Input
                      value={group.name}
                      onChange={(e) => {
                        const updatedChecklist = formData.checklist.map(g => 
                          g.id === group.id ? { ...g, name: e.target.value } : g
                        );
                        setFormData({ ...formData, checklist: updatedChecklist });
                      }}
                      className="font-semibold border-none shadow-none px-0 h-auto"
                    />
                    <Button size="sm" variant="outline" onClick={() => addChecklistItem(group.id)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(group.items || []).map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(group.id, item.id)}
                          className="w-4 h-4"
                        />
                        <span className={item.completed ? 'line-through text-slate-500' : ''}>
                          {item.text}
                        </span>
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

            <TabsContent value="attachments" className="space-y-3">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      {uploadingFile ? 'Upload en cours...' : 'Cliquez pour uploader'}
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
                  <Button size="sm" variant="outline" onClick={() => window.open(attachment.url, '_blank')}>
                    Voir
                  </Button>
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
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.title}>
              {call ? 'Sauvegarder' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
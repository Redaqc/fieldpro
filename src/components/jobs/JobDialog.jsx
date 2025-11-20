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
import { X, Plus, CheckSquare, MessageSquare, Activity, Paperclip, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function JobDialog({ open, onClose, job, users, currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    due_date: '',
    priority: 'medium',
    labels: [],
    assigned_to: [],
    assigned_names: [],
    trello_card_reference: '',
    checklist: [],
    comments: [],
    activity_log: [],
    attachments: [],
  });

  const [newLabel, setNewLabel] = useState('');
  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        labels: job.labels || [],
        assigned_to: job.assigned_to || [],
        assigned_names: job.assigned_names || [],
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
        labels: [],
        assigned_to: [],
        assigned_names: [],
        trello_card_reference: '',
        checklist: [],
        comments: [],
        activity_log: [],
        attachments: [],
      });
    }
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
    if (newLabel && !formData.labels.includes(newLabel)) {
      const updatedLabels = [...formData.labels, newLabel];
      setFormData({ ...formData, labels: updatedLabels });
      setNewLabel('');
      
      if (job) {
        updateJobMutation.mutate({
          id: job.id,
          data: { labels: updatedLabels },
        });
      }
    }
  };

  const removeLabel = (label) => {
    const updatedLabels = formData.labels.filter(l => l !== label);
    setFormData({ ...formData, labels: updatedLabels });
    
    if (job) {
      updateJobMutation.mutate({
        id: job.id,
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

  const toggleMember = (userId, userName) => {
    const isAssigned = formData.assigned_to.includes(userId);
    const updatedAssignedTo = isAssigned
      ? formData.assigned_to.filter(id => id !== userId)
      : [...formData.assigned_to, userId];
    const updatedAssignedNames = isAssigned
      ? formData.assigned_names.filter(name => name !== userName)
      : [...formData.assigned_names, userName];

    setFormData({
      ...formData,
      assigned_to: updatedAssignedTo,
      assigned_names: updatedAssignedNames,
    });

    if (job) {
      updateJobMutation.mutate({
        id: job.id,
        data: { 
          assigned_to: updatedAssignedTo,
          assigned_names: updatedAssignedNames,
        },
      });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? 'Modifier le job' : 'Nouveau job'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre du job"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
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
              <Label>Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
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
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            {/* Trello Reference */}
            <div>
              <Label>Référence Trello</Label>
              <Input
                value={formData.trello_card_reference}
                onChange={(e) => setFormData({ ...formData, trello_card_reference: e.target.value })}
                placeholder="URL ou ID Trello"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <Label>Labels</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {formData.labels.map((label, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeLabel(label)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nouveau label"
                onKeyDown={(e) => e.key === 'Enter' && addLabel()}
              />
              <Button onClick={addLabel} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Members */}
          <div>
            <Label>Membres assignés</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {users.map(user => {
                const isAssigned = formData.assigned_to.includes(user.id);
                return (
                  <Badge
                    key={user.id}
                    variant={isAssigned ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMember(user.id, user.full_name)}
                  >
                    {user.full_name}
                  </Badge>
                );
              })}
            </div>
          </div>

          <Tabs defaultValue="checklist" className="w-full">
            <TabsList>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Pièces jointes ({formData.attachments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Commentaires ({formData.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activité
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.title}>
              {job ? 'Sauvegarder' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { PRIORITY, CUSTOMER_STATUS } from "@/constants/statuses";

export default function AutomationDialog({ open, onClose, automation, formTemplates }) {
  const [formData, setFormData] = useState({
    form_template_id: '',
    form_name: '',
    name: '',
    description: '',
    active: true,
    trigger_conditions: {
      status: ['submitted'],
      field_conditions: []
    },
    actions: []
  });

  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  useEffect(() => {
    if (automation) {
      setFormData(automation);
    } else {
      setFormData({
        form_template_id: '',
        form_name: '',
        name: '',
        description: '',
        active: true,
        trigger_conditions: {
          status: ['submitted'],
          field_conditions: []
        },
        actions: []
      });
    }
  }, [automation, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FormAutomation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formAutomations'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FormAutomation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formAutomations'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (automation) {
      updateMutation.mutate({ id: automation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'send_email', config: {} }]
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    if (field === 'type') {
      newActions[index] = { type: value, config: {} };
    } else {
      newActions[index].config[field] = value;
    }
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const toggleStatus = (status) => {
    const currentStatuses = formData.trigger_conditions.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    setFormData({
      ...formData,
      trigger_conditions: {
        ...formData.trigger_conditions,
        status: newStatuses
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{automation ? 'Modifier' : 'Créer'} une automatisation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Formulaire</Label>
            <Select 
              value={formData.form_template_id} 
              onValueChange={(value) => {
                const template = formTemplates.find(t => t.id === value);
                setFormData({ 
                  ...formData, 
                  form_template_id: value,
                  form_name: template?.name || ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un formulaire" />
              </SelectTrigger>
              <SelectContent>
                {formTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nom de l'automatisation</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Notification sécurité urgente"
            />
          </div>

          <div>
            <Label>Description (optionnelle)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrire l'objectif de cette automatisation..."
              rows={2}
            />
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Label>Déclencher quand le statut est:</Label>
              <div className="flex gap-2 flex-wrap">
                {['draft', 'submitted', 'reviewed', 'approved'].map(status => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={formData.trigger_conditions.status?.includes(status) ? 'default' : 'outline'}
                    onClick={() => toggleStatus(status)}
                  >
                    {status === 'draft' ? 'Brouillon' :
                     status === 'submitted' ? 'Soumis' :
                     status === 'reviewed' ? 'Révisé' :
                     status === 'approved' ? 'Approuvé' : status}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Actions à exécuter</Label>
              <Button type="button" size="sm" onClick={addAction}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter action
              </Button>
            </div>

            {formData.actions.map((action, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Action {index + 1}</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  <Select value={action.type} onValueChange={(value) => updateAction(index, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_email">Envoyer Email</SelectItem>
                      <SelectItem value="create_job">Créer Job</SelectItem>
                      <SelectItem value="create_notification">Créer Notification</SelectItem>
                      <SelectItem value="update_customer_status">Mettre à jour statut client</SelectItem>
                      <SelectItem value="assign_technician">Assigner Technicien</SelectItem>
                    </SelectContent>
                  </Select>

                  {action.type === 'send_email' && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Email destinataire"
                        value={action.config.to || ''}
                        onChange={(e) => updateAction(index, 'to', e.target.value)}
                      />
                      <Input
                        placeholder="Sujet"
                        value={action.config.subject || ''}
                        onChange={(e) => updateAction(index, 'subject', e.target.value)}
                      />
                      <Textarea
                        placeholder="Corps du message (utiliser {form_name}, {submitted_by}, {submission_date})"
                        value={action.config.body || ''}
                        onChange={(e) => updateAction(index, 'body', e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {action.type === 'create_job' && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Titre du job"
                        value={action.config.title || ''}
                        onChange={(e) => updateAction(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Description"
                        value={action.config.description || ''}
                        onChange={(e) => updateAction(index, 'description', e.target.value)}
                        rows={2}
                      />
                      <Select
                        value={action.config.priority || PRIORITY.MEDIUM}
                        onValueChange={(value) => updateAction(index, 'priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PRIORITY.LOW}>Basse</SelectItem>
                          <SelectItem value={PRIORITY.MEDIUM}>Moyenne</SelectItem>
                          <SelectItem value={PRIORITY.HIGH}>Haute</SelectItem>
                          <SelectItem value={PRIORITY.URGENT}>Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {action.type === 'create_notification' && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Email utilisateur (laisser vide = soumetteur)"
                        value={action.config.user_email || ''}
                        onChange={(e) => updateAction(index, 'user_email', e.target.value)}
                      />
                      <Input
                        placeholder="Titre notification"
                        value={action.config.title || ''}
                        onChange={(e) => updateAction(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Message"
                        value={action.config.message || ''}
                        onChange={(e) => updateAction(index, 'message', e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}

                  {action.type === 'update_customer_status' && (
                    <Select
                      value={action.config.status || CUSTOMER_STATUS.ACTIVE}
                      onValueChange={(value) => updateAction(index, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nouveau statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CUSTOMER_STATUS.ACTIVE}>Actif</SelectItem>
                        <SelectItem value={CUSTOMER_STATUS.INACTIVE}>Inactif</SelectItem>
                        <SelectItem value={CUSTOMER_STATUS.VIP}>VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {action.type === 'assign_technician' && (
                    <Select 
                      value={action.config.technician_id || ''} 
                      onValueChange={(value) => updateAction(index, 'technician_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner technicien" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map(tech => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.first_name} {tech.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.form_template_id || !formData.name || formData.actions.length === 0}>
              {automation ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Save, Eye, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import FormPreviewDialog from "@/components/forms/FormPreviewDialog";

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Heure' },
  { value: 'select', label: 'Sélection' },
  { value: 'multiselect', label: 'Multi-sélection' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'radio', label: 'Choix unique' },
  { value: 'signature', label: 'Signature' },
  { value: 'photo', label: 'Photo' },
  { value: 'rating', label: 'Évaluation' },
];

export default function FormBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    fields: [],
    require_signature: false,
    auto_pdf: true,
    active: true,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const createFormMutation = useMutation({
    mutationFn: (data) => base44.entities.FormTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
      alert('Formulaire créé avec succès!');
      setFormData({
        name: '',
        description: '',
        category: 'other',
        fields: [],
        require_signature: false,
        auto_pdf: true,
        active: true,
      });
    },
  });

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Nouveau champ',
      placeholder: '',
      required: false,
      options: [],
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const updateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(formData.fields);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setFormData({ ...formData, fields: items });
  };

  const handleSave = () => {
    if (!formData.name) {
      alert('Le nom du formulaire est requis');
      return;
    }
    if (formData.fields.length === 0) {
      alert('Ajoutez au moins un champ');
      return;
    }
    createFormMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Créateur de Formulaires
          </h1>
          <p className="text-slate-500 mt-1">Créez des formulaires personnalisés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={formData.fields.length === 0}>
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom du formulaire *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Inspection de sécurité"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Sécurité</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="quality">Qualité</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Signature requise</Label>
              <Switch
                checked={formData.require_signature}
                onCheckedChange={(checked) => setFormData({ ...formData, require_signature: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Générer PDF auto</Label>
              <Switch
                checked={formData.auto_pdf}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_pdf: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Champs du formulaire</CardTitle>
            <Button onClick={addField} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {formData.fields.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Aucun champ. Cliquez sur "Ajouter" pour commencer.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {formData.fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg p-4 bg-slate-50"
                            >
                              <div className="flex items-start gap-3">
                                <div {...provided.dragHandleProps} className="mt-2">
                                  <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input
                                      value={field.label}
                                      onChange={(e) => updateField(index, { label: e.target.value })}
                                      placeholder="Label du champ"
                                    />
                                    <Select
                                      value={field.type}
                                      onValueChange={(value) => updateField(index, { type: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {FIELD_TYPES.map(type => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && (
                                    <Textarea
                                      value={field.options?.join('\n') || ''}
                                      onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                                      placeholder="Options (une par ligne)"
                                      rows={3}
                                    />
                                  )}
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateField(index, { required: e.target.checked })}
                                      />
                                      Requis
                                    </label>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeField(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      <FormPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        formData={formData}
      />
    </div>
  );
}
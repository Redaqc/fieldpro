import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, GripVertical, CheckSquare, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ChecklistTemplateDialog({ open, onClose, template, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    checklist_data: [],
    active: true
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        checklist_data: template.checklist_data || [],
        active: template.active !== false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        checklist_data: [],
        active: true
      });
    }
  }, [template, open]);

  const addSection = () => {
    setFormData({
      ...formData,
      checklist_data: [
        ...formData.checklist_data,
        {
          id: `section_${Date.now()}`,
          name: 'Nouvelle section',
          items: []
        }
      ]
    });
  };

  const updateSection = (sectionId, field, value) => {
    setFormData({
      ...formData,
      checklist_data: formData.checklist_data.map(section =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    });
  };

  const deleteSection = (sectionId) => {
    setFormData({
      ...formData,
      checklist_data: formData.checklist_data.filter(section => section.id !== sectionId)
    });
  };

  const addItem = (sectionId) => {
    setFormData({
      ...formData,
      checklist_data: formData.checklist_data.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: `item_${Date.now()}`,
                  text: ''
                }
              ]
            }
          : section
      )
    });
  };

  const updateItem = (sectionId, itemId, value) => {
    setFormData({
      ...formData,
      checklist_data: formData.checklist_data.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, text: value } : item
              )
            }
          : section
      )
    });
  };

  const deleteItem = (sectionId, itemId) => {
    setFormData({
      ...formData,
      checklist_data: formData.checklist_data.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter(item => item.id !== itemId)
            }
          : section
      )
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'section') {
      const newSections = Array.from(formData.checklist_data);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);
      setFormData({ ...formData, checklist_data: newSections });
    } else if (type === 'item') {
      const sectionId = result.source.droppableId;
      const section = formData.checklist_data.find(s => s.id === sectionId);
      const newItems = Array.from(section.items);
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);

      setFormData({
        ...formData,
        checklist_data: formData.checklist_data.map(s =>
          s.id === sectionId ? { ...s, items: newItems } : s
        )
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Le nom du modèle est requis');
      return;
    }

    // Clean up IDs before saving (remove temporary IDs)
    const cleanedData = {
      ...formData,
      checklist_data: formData.checklist_data.map(section => ({
        name: section.name,
        items: section.items.map(item => ({
          text: item.text
        }))
      }))
    };

    onSave(cleanedData);
  };

  const totalItems = formData.checklist_data.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? 'Modifier le modèle' : 'Nouveau modèle de checklist'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Template Info */}
          <div className="space-y-4">
            <div>
              <Label>Nom du modèle *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Installation électrique, Inspection HVAC..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez à quoi sert ce modèle..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          {/* Stats */}
          {formData.checklist_data.length > 0 && (
            <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formData.checklist_data.length}</p>
                <p className="text-xs text-slate-500">Section{formData.checklist_data.length > 1 ? 's' : ''}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{totalItems}</p>
                <p className="text-xs text-slate-500">Élément{totalItems > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Sections de la checklist</Label>
              <Button onClick={addSection} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une section
              </Button>
            </div>

            {formData.checklist_data.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 mb-2">Aucune section</p>
                <p className="text-sm text-slate-400">Ajoutez des sections pour organiser vos tâches</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections" type="section">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {formData.checklist_data.map((section, sectionIndex) => (
                        <Draggable
                          key={section.id}
                          draggableId={section.id}
                          index={sectionIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border rounded-lg p-4 bg-white ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                              }`}
                            >
                              {/* Section Header */}
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-5 h-5 text-slate-400" />
                                </div>
                                <Input
                                  value={section.name}
                                  onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                                  placeholder="Nom de la section..."
                                  className="flex-1 font-semibold"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteSection(section.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Items */}
                              <Droppable droppableId={section.id} type="item">
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2 ml-8"
                                  >
                                    {section.items.map((item, itemIndex) => (
                                      <Draggable
                                        key={item.id}
                                        draggableId={item.id}
                                        index={itemIndex}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex items-center gap-2 ${
                                              snapshot.isDragging ? 'opacity-50' : ''
                                            }`}
                                          >
                                            <div
                                              {...provided.dragHandleProps}
                                              className="cursor-grab active:cursor-grabbing"
                                            >
                                              <GripVertical className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <CheckSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <Input
                                              value={item.text}
                                              onChange={(e) => updateItem(section.id, item.id, e.target.value)}
                                              placeholder="Élément de la checklist..."
                                              className="flex-1 h-9 text-sm"
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => deleteItem(section.id, item.id)}
                                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Add Item Button */}
                                    <Button
                                      onClick={() => addItem(section.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-slate-500 hover:text-blue-600 hover:bg-blue-50 mt-2"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Ajouter un élément
                                    </Button>
                                  </div>
                                )}
                              </Droppable>
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
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-slate-500">
            {formData.checklist_data.length > 0 && (
              <span>{formData.checklist_data.length} section(s) • {totalItems} élément(s)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {template ? 'Sauvegarder' : 'Créer le modèle'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
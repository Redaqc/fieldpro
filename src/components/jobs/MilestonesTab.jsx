import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Plus, Trash2, CheckCircle, Circle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const MILESTONE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
];

export default function MilestonesTab({ formData, setFormData, job, updateJobMutation }) {
  const [editingId, setEditingId] = useState(null);

  const addMilestone = () => {
    const newMilestone = {
      id: `milestone_${Date.now()}`,
      name: 'Nouveau jalon',
      description: '',
      date: '',
      completed: false,
      color: '#3b82f6'
    };
    
    const updatedMilestones = [...(formData.milestones || []), newMilestone];
    setFormData({ ...formData, milestones: updatedMilestones });
    setEditingId(newMilestone.id);
    
    if (job) {
      updateJobMutation.mutate({ 
        id: job.id, 
        data: { milestones: updatedMilestones } 
      });
    }
  };

  const updateMilestone = (id, updates) => {
    const updatedMilestones = (formData.milestones || []).map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    setFormData({ ...formData, milestones: updatedMilestones });
    
    if (job) {
      updateJobMutation.mutate({ 
        id: job.id, 
        data: { milestones: updatedMilestones } 
      });
    }
  };

  const deleteMilestone = (id) => {
    const updatedMilestones = (formData.milestones || []).filter(m => m.id !== id);
    setFormData({ ...formData, milestones: updatedMilestones });
    
    if (job) {
      updateJobMutation.mutate({ 
        id: job.id, 
        data: { milestones: updatedMilestones } 
      });
    }
  };

  const toggleComplete = (id) => {
    const milestone = (formData.milestones || []).find(m => m.id === id);
    if (!milestone) return;
    
    updateMilestone(id, {
      completed: !milestone.completed,
      completed_at: !milestone.completed ? new Date().toISOString() : null
    });
  };

  const milestones = (formData.milestones || []).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Jalons du projet</h3>
          <p className="text-sm text-slate-500">Définissez les étapes clés à atteindre</p>
        </div>
        <Button onClick={addMilestone} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter un jalon
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Flag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 mb-2">Aucun jalon défini</p>
          <p className="text-sm text-slate-400">
            Les jalons vous aident à suivre les étapes importantes du projet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map(milestone => (
            <div 
              key={milestone.id}
              className={`border rounded-lg p-4 ${
                milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}
            >
              {editingId === milestone.id ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Nom du jalon</Label>
                    <Input
                      value={milestone.name}
                      onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
                      className="mt-1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={milestone.description || ''}
                      onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Date cible</Label>
                      <Input
                        type="date"
                        value={milestone.date || ''}
                        onChange={(e) => updateMilestone(milestone.id, { date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Couleur</Label>
                      <div className="flex gap-1 mt-1">
                        {MILESTONE_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded border-2 ${
                              milestone.color === color ? 'border-slate-900 scale-110' : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateMilestone(milestone.id, { color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(milestone.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {milestone.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  <Flag 
                    className="w-5 h-5 mt-1 flex-shrink-0" 
                    style={{ color: milestone.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${milestone.completed ? 'line-through text-slate-500' : ''}`}>
                      {milestone.name}
                    </h4>
                    {milestone.description && (
                      <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {milestone.date && (
                        <span className="flex items-center gap-1">
                          📅 {format(parseISO(milestone.date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {milestone.completed && milestone.completed_at && (
                        <span className="text-green-600">
                          ✓ Complété le {format(parseISO(milestone.completed_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(milestone.id)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Supprimer ce jalon?')) {
                          deleteMilestone(milestone.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistiques */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{milestones.length}</p>
            <p className="text-xs text-slate-500">Total jalons</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {milestones.filter(m => m.completed).length}
            </p>
            <p className="text-xs text-slate-500">Complétés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {milestones.filter(m => !m.completed).length}
            </p>
            <p className="text-xs text-slate-500">En attente</p>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff, List, Settings as SettingsIcon, GitBranch, Flag, BarChart, FileText, TrendingDown, Paperclip, MessageSquare, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const [editingType, setEditingType] = useState(null);
  const [newType, setNewType] = useState({ name: "", label_fr: "", label_en: "", color: "#0074D9" });
  const queryClient = useQueryClient();

  const { data: workTypes = [] } = useQuery({
    queryKey: ['workTypes'],
    queryFn: () => base44.entities.WorkType.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: checklistTemplates = [] } = useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: () => base44.entities.ChecklistTemplate.list(),
    initialData: [],
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.list();
      return settings[0] || null;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workTypes'] });
      setNewType({ name: "", label_fr: "", label_en: "", color: "#0074D9" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workTypes'] });
      setEditingType(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workTypes'] });
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Technician.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  const togglePriceVisibility = (techId, currentValue) => {
    updateTechnicianMutation.mutate({
      id: techId,
      data: { can_view_prices: !currentValue }
    });
  };

  const createChecklistMutation = useMutation({
    mutationFn: (data) => base44.entities.ChecklistTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
    },
  });

  const updateAppSettingsMutation = useMutation({
    mutationFn: (data) => {
      if (appSettings?.id) {
        return base44.entities.AppSettings.update(appSettings.id, data);
      } else {
        return base44.entities.AppSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    },
  });

  const toggleFeature = (feature, currentValue) => {
    updateAppSettingsMutation.mutate({
      [feature]: !currentValue
    });
  };

  const handleCreateTemplate = () => {
    const name = prompt('Nom du modèle de checklist:');
    if (!name) return;

    const template = {
      name,
      checklist_data: [
        {
          name: 'Nouvelle section',
          items: [
            { text: 'Élément 1' },
            { text: 'Élément 2' },
          ]
        }
      ],
      active: true
    };

    createChecklistMutation.mutate(template);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 mt-1">Configuration du système</p>
      </div>

      <Tabs defaultValue="work-types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="work-types">Types de travaux</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités Jobs</TabsTrigger>
          <TabsTrigger value="checklists">Modèles de checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="work-types">
          <Card>
        <CardHeader>
          <CardTitle>Types de travaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Type */}
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Ajouter un nouveau type</h3>
            <div className="grid grid-cols-4 gap-3">
              <Input
                placeholder="ID (ex: plumbing)"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              />
              <Input
                placeholder="Label FR"
                value={newType.label_fr}
                onChange={(e) => setNewType({ ...newType, label_fr: e.target.value })}
              />
              <Input
                placeholder="Label EN"
                value={newType.label_en}
                onChange={(e) => setNewType({ ...newType, label_en: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={newType.color}
                  onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                  className="w-16"
                />
                <Button
                  onClick={() => createMutation.mutate(newType)}
                  disabled={!newType.name || !newType.label_fr}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Types */}
          <div className="space-y-2">
            {workTypes.map(type => (
              <div key={type.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {editingType?.id === type.id ? (
                  <>
                    <Input
                      value={editingType.name}
                      onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                      className="w-32"
                    />
                    <Input
                      value={editingType.label_fr}
                      onChange={(e) => setEditingType({ ...editingType, label_fr: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      value={editingType.label_en}
                      onChange={(e) => setEditingType({ ...editingType, label_en: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={editingType.color}
                      onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                      className="w-16"
                    />
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: type.id, data: editingType })}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingType(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: type.color || '#0074D9' }}
                    />
                    <span className="font-mono text-xs text-slate-500 w-32">{type.name}</span>
                    <span className="flex-1">{type.label_fr}</span>
                    <span className="flex-1 text-slate-500">{type.label_en || '-'}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingType(type)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Supprimer ce type de travail?')) {
                          deleteMutation.mutate(type.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Visibilité des prix</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Contrôlez quels techniciens peuvent voir les prix dans les factures, soumissions et jobs.
              </p>
              <div className="space-y-3">
                {technicians.map(tech => (
                  <div key={tech.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: tech.color || '#64748b' }}
                      >
                        {tech.first_name[0]}{tech.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{tech.first_name} {tech.last_name}</p>
                        <p className="text-xs text-slate-500">{tech.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {tech.can_view_prices ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                      <Switch
                        checked={tech.can_view_prices !== false}
                        onCheckedChange={() => togglePriceVisibility(tech.id, tech.can_view_prices !== false)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités des Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-6">
                Activez ou désactivez les fonctionnalités avancées dans les jobs
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Dépendances de tâches</p>
                      <p className="text-xs text-slate-500">Gérer les dépendances entre les tâches</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_task_dependencies !== false}
                    onCheckedChange={() => toggleFeature('feature_task_dependencies', appSettings?.feature_task_dependencies !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Flag className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Jalons</p>
                      <p className="text-xs text-slate-500">Définir des étapes clés du projet</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_milestones !== false}
                    onCheckedChange={() => toggleFeature('feature_milestones', appSettings?.feature_milestones !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Diagramme de Gantt</p>
                      <p className="text-xs text-slate-500">Visualisation chronologique du projet</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_gantt_chart !== false}
                    onCheckedChange={() => toggleFeature('feature_gantt_chart', appSettings?.feature_gantt_chart !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium">Facturation</p>
                      <p className="text-xs text-slate-500">Gérer la facturation dans les jobs</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_job_invoicing !== false}
                    onCheckedChange={() => toggleFeature('feature_job_invoicing', appSettings?.feature_job_invoicing !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Gestion des coûts</p>
                      <p className="text-xs text-slate-500">Suivre les coûts détaillés du projet</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_job_costs !== false}
                    onCheckedChange={() => toggleFeature('feature_job_costs', appSettings?.feature_job_costs !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="font-medium">Fichiers joints</p>
                      <p className="text-xs text-slate-500">Attacher des documents aux jobs</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_job_attachments !== false}
                    onCheckedChange={() => toggleFeature('feature_job_attachments', appSettings?.feature_job_attachments !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="font-medium">Commentaires</p>
                      <p className="text-xs text-slate-500">Permettre les commentaires sur les jobs</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_job_comments !== false}
                    onCheckedChange={() => toggleFeature('feature_job_comments', appSettings?.feature_job_comments !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="font-medium">Journal d'activité</p>
                      <p className="text-xs text-slate-500">Suivre l'historique des modifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_job_activity !== false}
                    onCheckedChange={() => toggleFeature('feature_job_activity', appSettings?.feature_job_activity !== false)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Modèles de checklist</CardTitle>
                <Button onClick={handleCreateTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau modèle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistTemplates.map(template => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <List className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-lg">{template.name}</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Supprimer ce modèle?')) {
                          deleteChecklistMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="space-y-2 pl-7">
                    {(template.checklist_data || []).map((group, gIdx) => (
                      <div key={gIdx} className="text-sm">
                        <p className="font-medium text-slate-700">{group.name}</p>
                        <ul className="list-disc list-inside text-slate-600 ml-2">
                          {(group.items || []).map((item, iIdx) => (
                            <li key={iIdx}>{item.text}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {checklistTemplates.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <List className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucun modèle de checklist</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </div>
        );
        }
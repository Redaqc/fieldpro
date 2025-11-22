import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Calendar, User, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TaskDependenciesTab({ formData, setFormData, job, updateJobMutation, technicians = [] }) {
  const [expandedTask, setExpandedTask] = useState(null);

  const allTasks = [];
  (formData.checklist || []).forEach(group => {
    (group.items || []).forEach(item => {
      allTasks.push({
        ...item,
        groupId: group.id,
        groupName: group.name
      });
    });
  });

  const updateTask = (groupId, taskId, updates) => {
    const updatedChecklist = (formData.checklist || []).map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.map(item => 
            item.id === taskId ? { ...item, ...updates } : item
          )
        };
      }
      return group;
    });

    setFormData({ ...formData, checklist: updatedChecklist });
    
    if (job) {
      updateJobMutation.mutate({ 
        id: job.id, 
        data: { checklist: updatedChecklist } 
      });
    }
  };

  const addDependency = (groupId, taskId, dependencyId) => {
    const task = allTasks.find(t => t.id === taskId);
    const dependencies = task?.dependencies || [];
    
    if (!dependencies.includes(dependencyId)) {
      updateTask(groupId, taskId, {
        dependencies: [...dependencies, dependencyId]
      });
    }
  };

  const removeDependency = (groupId, taskId, dependencyId) => {
    const task = allTasks.find(t => t.id === taskId);
    const dependencies = (task?.dependencies || []).filter(d => d !== dependencyId);
    updateTask(groupId, taskId, { dependencies });
  };

  const getTasksBlockedBy = (taskId) => {
    return allTasks.filter(t => 
      (t.dependencies || []).includes(taskId)
    );
  };

  const getDependencyTasks = (task) => {
    return (task.dependencies || [])
      .map(depId => allTasks.find(t => t.id === depId))
      .filter(Boolean);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Gestion des dépendances</h3>
        <p className="text-sm text-slate-500">
          Définissez les dates et dépendances entre les tâches pour optimiser la planification
        </p>
      </div>

      {allTasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <GitBranch className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Aucune tâche dans les checklists</p>
          <p className="text-sm text-slate-400 mt-1">
            Ajoutez des tâches dans l'onglet Checklist pour gérer les dépendances
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTasks.map(task => {
            const isExpanded = expandedTask === task.id;
            const dependencies = getDependencyTasks(task);
            const blockedTasks = getTasksBlockedBy(task.id);
            const tech = technicians.find(t => t.id === task.assigned_to);

            return (
              <div key={task.id} className="border rounded-lg overflow-hidden">
                {/* En-tête de tâche */}
                <div 
                  className="p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium text-sm truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
                          {task.text}
                        </p>
                        {dependencies.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <GitBranch className="w-3 h-3 mr-1" />
                            {dependencies.length}
                          </Badge>
                        )}
                        {blockedTasks.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-orange-50">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Bloque {blockedTasks.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{task.groupName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      {task.start_date && task.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.start_date} → {task.end_date}
                        </span>
                      )}
                      {tech && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {tech.first_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails de la tâche */}
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Date de début</Label>
                        <Input
                          type="date"
                          value={task.start_date || ''}
                          onChange={(e) => updateTask(task.groupId, task.id, { start_date: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Date de fin</Label>
                        <Input
                          type="date"
                          value={task.end_date || ''}
                          onChange={(e) => updateTask(task.groupId, task.id, { end_date: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>

                    {/* Assignation */}
                    <div>
                      <Label className="text-xs">Assigné à</Label>
                      <Select
                        value={task.assigned_to || ''}
                        onValueChange={(value) => updateTask(task.groupId, task.id, { assigned_to: value })}
                      >
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="Non assigné" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Non assigné</SelectItem>
                          {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.first_name} {tech.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Progression */}
                    <div>
                      <Label className="text-xs">Progression (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress || 0}
                        onChange={(e) => updateTask(task.groupId, task.id, { progress: parseInt(e.target.value) || 0 })}
                        className="mt-1 h-9"
                      />
                    </div>

                    {/* Dépendances */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">Dépendances (cette tâche dépend de)</Label>
                      </div>
                      
                      {dependencies.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {dependencies.map(dep => (
                            <div key={dep.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                              <span className="flex-1 truncate">{dep.text}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDependency(task.groupId, task.id, dep.id)}
                                className="h-6 text-red-500"
                              >
                                Retirer
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Select
                        onValueChange={(depId) => addDependency(task.groupId, task.id, depId)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Ajouter une dépendance" />
                        </SelectTrigger>
                        <SelectContent>
                          {allTasks
                            .filter(t => t.id !== task.id && !(task.dependencies || []).includes(t.id))
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.text} ({t.groupName})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tâches bloquées */}
                    {blockedTasks.length > 0 && (
                      <div>
                        <Label className="text-xs text-orange-600">
                          ⚠️ Cette tâche bloque {blockedTasks.length} autre(s) tâche(s)
                        </Label>
                        <div className="mt-1 space-y-1">
                          {blockedTasks.map(blocked => (
                            <div key={blocked.id} className="text-xs p-2 bg-orange-50 rounded">
                              {blocked.text} ({blocked.groupName})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

// NEW: Import our custom hooks
import { useFormAutomationss, useDeleteFormAutomations, useUpdateFormAutomations } from "@/hooks/useFormAutomationss";
import { useFormTemplatess } from "@/hooks/useFormTemplatess";

import AutomationDialog from "@/components/forms/AutomationDialog";

export default function FormAutomations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const queryClient = useQueryClient();

  // NEW: Use our custom hooks
  const { data: automationsData } = useFormAutomationss({ page: 1, limit: 1000 });
  const automations = automationsData?.data || [];

  const { data: formTemplatesData } = useFormTemplatess({ page: 1, limit: 1000 });
  const formTemplates = formTemplatesData?.data || [];

  const deleteAutomationMutation = useDeleteFormAutomations();
  const updateAutomationMutation = useUpdateFormAutomations();

  const toggleAutomationMutation = useMutation({
    mutationFn: ({ id, active }) => updateAutomationMutation.mutateAsync({ id, data: { active: !active } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formAutomations'] });
    },
  });

  // Transform data to match component expectations (snake_case)
  const transformedAutomations = automations.map(automation => ({
    ...automation,
    form_name: automation.formName,
    execution_count: automation.executionCount,
    trigger_conditions: automation.triggerConditions,
    created_date: automation.createdAt,
  }));

  const transformedFormTemplates = formTemplates.map(template => ({
    ...template,
    is_active: template.isActive,
  }));

  const getActionTypeLabel = (type) => {
    const labels = {
      send_email: 'Envoyer Email',
      create_job: 'Créer Job',
      update_document_status: 'Maj Statut Doc',
      update_customer_status: 'Maj Statut Client',
      create_notification: 'Créer Notification',
      assign_technician: 'Assigner Technicien'
    };
    return labels[type] || type;
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer cette automatisation ?')) {
      deleteAutomationMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            Automatisations de Formulaires
          </h1>
          <p className="text-slate-500 mt-1">Déclenchez des actions automatiques lors des soumissions</p>
        </div>
        <Button onClick={() => { setSelectedAutomation(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Automatisation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{transformedAutomations.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Actives</p>
            <p className="text-2xl font-bold text-slate-900">{transformedAutomations.filter(a => a.active).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Exécutions totales</p>
            <p className="text-2xl font-bold text-slate-900">
              {transformedAutomations.reduce((sum, a) => sum + (a.execution_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {transformedAutomations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Zap className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucune automatisation</h3>
              <p className="text-slate-500 mb-4">Créez votre première automatisation pour gagner du temps</p>
              <Button onClick={() => { setSelectedAutomation(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une automatisation
              </Button>
            </CardContent>
          </Card>
        ) : (
          transformedAutomations.map(automation => (
            <Card key={automation.id} className={`${!automation.active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{automation.name}</CardTitle>
                      {automation.active ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700">Inactive</Badge>
                      )}
                    </div>
                    {automation.description && (
                      <p className="text-sm text-slate-600">{automation.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {automation.form_name || 'Formulaire'}
                      </Badge>
                      <Badge variant="outline">
                        {automation.execution_count || 0} exécutions
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleAutomationMutation.mutate({ id: automation.id, active: automation.active })}
                    >
                      {automation.active ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setSelectedAutomation(automation); setDialogOpen(true); }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(automation.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Actions déclenchées:</p>
                    <div className="flex gap-2 flex-wrap">
                      {automation.actions?.map((action, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700">
                          {getActionTypeLabel(action.type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {automation.trigger_conditions?.status && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Conditions de déclenchement:</p>
                      <div className="flex gap-2 flex-wrap">
                        {automation.trigger_conditions.status.map((status, idx) => (
                          <Badge key={idx} variant="outline">
                            Statut: {status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AutomationDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedAutomation(null); }}
        automation={selectedAutomation}
        formTemplates={transformedFormTemplates}
      />
    </div>
  );
}

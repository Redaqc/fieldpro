import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Edit, Trash2, Clock } from "lucide-react";
import AutomationRuleDialog from "@/components/automations/AutomationRuleDialog";

export default function AutomationRules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: automations = [] } = useQuery({
    queryKey: ['automations'],
    queryFn: () => base44.entities.Automation.list(),
    initialData: [],
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Automation.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const typeLabels = {
    'schedule_job': 'Auto-Schedule',
    'alert_overdue': 'Overdue Alerts',
    'alert_low_stock': 'Low Stock Alerts',
    'alert_technician_late': 'Technician Late',
    'auto_invoice': 'Auto-Invoice',
    'recurring_job': 'Recurring Jobs',
    'status_change': 'Status Change'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Automation Rules</h1>
          <p className="text-slate-500 mt-1">Configure automated workflows and triggers</p>
        </div>
        <Button onClick={() => { setSelectedRule(null); setDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {automations.map(rule => (
          <Card key={rule.id} className={rule.active ? 'border-purple-200' : 'opacity-60'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className={`w-5 h-5 ${rule.active ? 'text-purple-600' : 'text-slate-400'}`} />
                    {rule.name}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{rule.description}</p>
                </div>
                <Switch
                  checked={rule.active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: rule.id, active: checked })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline">
                {typeLabels[rule.type] || rule.type}
              </Badge>

              {rule.schedule && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">Runs {rule.schedule.frequency}</span>
                </div>
              )}

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Actions:</span>
                  <span className="font-medium">{rule.actions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Executions:</span>
                  <span className="font-medium">{rule.execution_count || 0}</span>
                </div>
                {rule.last_execution && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last run:</span>
                    <span className="font-medium text-xs">
                      {new Date(rule.last_execution).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedRule(rule); setDialogOpen(true); }}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete this automation rule?')) {
                      deleteMutation.mutate(rule.id);
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {automations.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg">
            <Zap className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No automation rules</h3>
            <p className="text-slate-500 mb-4">Create rules to automate your workflows</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <AutomationRuleDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setSelectedRule(null); }}
          rule={selectedRule}
        />
      )}
    </div>
  );
}
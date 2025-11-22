import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, CheckCircle, RefreshCw } from "lucide-react";

// NEW: Import our custom hooks
import { useRecurringJobss, useDeleteRecurringJobs, useUpdateRecurringJobs } from "@/hooks/useRecurringJobss";
import { useCustomers } from "@/hooks/useCustomers";
import { useTechnicians } from "@/hooks/useTechnicians";

import RecurringJobDialog from "@/components/recurring/RecurringJobDialog";

export default function RecurringJobs() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  // NEW: Use our custom hooks
  const { data: templatesData } = useRecurringJobss({ page: 1, limit: 1000 });
  const templates = templatesData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000 });
  const technicians = techniciansData?.data || [];

  const deleteMutation = useDeleteRecurringJobs();
  const updateMutation = useUpdateRecurringJobs();

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => updateMutation.mutateAsync({ id, data: { active } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringJobs'] });
    },
  });

  // Transform data to match component expectations (snake_case)
  const transformedTemplates = templates.map(template => ({
    ...template,
    template_name: template.templateName,
    job_template: template.jobTemplate ? {
      ...template.jobTemplate,
      customer_name: template.jobTemplate.customerName,
    } : null,
    last_generated: template.lastGenerated,
    next_scheduled: template.nextScheduled,
    start_date: template.startDate,
    end_date: template.endDate,
    generated_jobs: template.generatedJobs,
  }));

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    company_name: customer.companyName,
  }));

  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    first_name: tech.name?.split(' ')[0] || tech.name || '',
    last_name: tech.name?.split(' ').slice(1).join(' ') || '',
  }));

  const handleDelete = (id) => {
    if (confirm('Delete this recurring job template?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Recurring Jobs</h1>
          <p className="text-slate-500 mt-1">Automate recurring maintenance and scheduled work</p>
        </div>
        <Button onClick={() => { setSelectedTemplate(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transformedTemplates.map(template => (
          <Card key={template.id} className={template.active ? '' : 'opacity-60'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{template.job_template?.title}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActiveMutation.mutate({ id: template.id, active: !template.active })}
                  >
                    <CheckCircle className={`w-4 h-4 ${template.active ? 'text-green-600' : 'text-slate-400'}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSelectedTemplate(template); setDialogOpen(true); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{template.recurrence?.frequency}</span>
                {template.recurrence?.interval > 1 && (
                  <span className="text-slate-600">every {template.recurrence.interval}</span>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span className="font-medium">{template.job_template?.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last generated:</span>
                  <span className="font-medium">
                    {template.last_generated
                      ? new Date(template.last_generated).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Next scheduled:</span>
                  <span className="font-medium text-blue-600">
                    {template.next_scheduled
                      ? new Date(template.next_scheduled).toLocaleDateString()
                      : new Date(template.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jobs created:</span>
                  <span className="font-medium">{template.generated_jobs?.length || 0}</span>
                </div>
              </div>

              <Badge className={template.active ? 'bg-green-500' : 'bg-slate-400'}>
                {template.active ? 'Active' : 'Paused'}
              </Badge>
            </CardContent>
          </Card>
        ))}

        {transformedTemplates.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No recurring jobs</h3>
            <p className="text-slate-500 mb-4">Create templates for maintenance and scheduled work</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <RecurringJobDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setSelectedTemplate(null); }}
          template={selectedTemplate}
          customers={transformedCustomers}
          technicians={transformedTechnicians}
        />
      )}
    </div>
  );
}

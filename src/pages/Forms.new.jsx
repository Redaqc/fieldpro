import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Trash2, Edit, List, Send, Zap, Eye, Download, User, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// NEW: Import our custom hooks
import { useFormTemplatess, useDeleteFormTemplates } from "@/hooks/useFormTemplatess";
import { useFormSubmissionss, useDeleteFormSubmissions } from "@/hooks/useFormSubmissionss";
import { useJobs } from "@/hooks/useJobs";
import { useCustomers } from "@/hooks/useCustomers";

import FormFillDialog from "@/components/forms/FormFillDialog";
import SubmissionDetailDialog from "@/components/forms/SubmissionDetailDialog";

export default function Forms() {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formFilter, setFormFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // NEW: Use our custom hooks
  const { data: formTemplatesData } = useFormTemplatess({ page: 1, limit: 1000 });
  const formTemplates = formTemplatesData?.data || [];

  const { data: submissionsData } = useFormSubmissionss({ page: 1, limit: 1000 });
  const submissions = submissionsData?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const deleteTemplateMutation = useDeleteFormTemplates();
  const deleteSubmissionMutation = useDeleteFormSubmissions();

  // Transform data to match component expectations (snake_case)
  const transformedFormTemplates = formTemplates.map(template => ({
    ...template,
    is_active: template.isActive,
    created_by: template.createdBy,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
    active: template.isActive !== false,
  }));

  const transformedSubmissions = submissions.map(sub => ({
    ...sub,
    form_template_id: sub.formTemplateId,
    form_name: sub.formName,
    submitted_by: sub.submittedBy,
    submitted_by_name: sub.submittedByName,
    submission_date: sub.submissionDate,
    job_id: sub.jobId,
    customer_id: sub.customerId,
  }));

  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    job_number: job.jobNumber,
  }));

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    company_name: customer.companyName,
  }));

  const filteredTemplates = transformedFormTemplates.filter(t =>
    t.active !== false &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSubmissions = transformedSubmissions.filter(sub => {
    const matchesSearch = sub.form_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.submitted_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesForm = formFilter === 'all' || sub.form_template_id === formFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === 'today' && sub.submission_date) {
      const today = new Date().toDateString();
      matchesDate = new Date(sub.submission_date).toDateString() === today;
    } else if (dateFilter === 'week' && sub.submission_date) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(sub.submission_date) >= weekAgo;
    } else if (dateFilter === 'month' && sub.submission_date) {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(sub.submission_date) >= monthAgo;
    }

    return matchesSearch && matchesForm && matchesStatus && matchesDate;
  });

  const templateStats = {
    total: transformedFormTemplates.length,
    safety: transformedFormTemplates.filter(f => f.category === 'safety').length,
    inspection: transformedFormTemplates.filter(f => f.category === 'inspection').length,
    active: transformedFormTemplates.filter(f => f.active !== false).length,
  };

  const submissionStats = {
    total: transformedSubmissions.length,
    submitted: transformedSubmissions.filter(s => s.status === 'submitted').length,
    reviewed: transformedSubmissions.filter(s => s.status === 'reviewed').length,
    approved: transformedSubmissions.filter(s => s.status === 'approved').length,
  };

  const getCategoryColor = (category) => {
    const colors = {
      safety: 'bg-red-100 text-red-700',
      inspection: 'bg-blue-100 text-blue-700',
      incident: 'bg-orange-100 text-orange-700',
      quality: 'bg-green-100 text-green-700',
      maintenance: 'bg-purple-100 text-purple-700',
      other: 'bg-slate-100 text-slate-700',
    };
    return colors[category] || colors.other;
  };

  const getSubmissionCount = (templateId) => {
    return transformedSubmissions.filter(s => s.form_template_id === templateId).length;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-purple-100 text-purple-700';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleDeleteTemplate = (id) => {
    if (confirm('Supprimer ce formulaire?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleDeleteSubmission = (id) => {
    if (confirm('Supprimer cette soumission?')) {
      deleteSubmissionMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Formulaires</h1>
          <p className="text-slate-500 mt-1">Gérez vos formulaires et soumissions</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('FormAutomations')}>
            <Button variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Automatisations
            </Button>
          </Link>
          <Link to={createPageUrl('FormBuilder')}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un formulaire
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Modèles ({templateStats.total})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Soumissions ({submissionStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{templateStats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-green-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Actifs</p>
                <p className="text-2xl font-bold text-slate-900">{templateStats.active}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-orange-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Sécurité</p>
                <p className="text-2xl font-bold text-slate-900">{templateStats.safety}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-purple-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Inspections</p>
                <p className="text-2xl font-bold text-slate-900">{templateStats.inspection}</p>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Rechercher formulaires..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    </div>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>

                  {template.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="text-xs text-slate-500 mb-3">
                    {getSubmissionCount(template.id)} soumissions
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setFillDialogOpen(true);
                      }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Remplir
                    </Button>
                    <Link to={createPageUrl('FormBuilder', { id: template.id })}>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{submissionStats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-cyan-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Soumis</p>
                <p className="text-2xl font-bold text-slate-900">{submissionStats.submitted}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-purple-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Révisés</p>
                <p className="text-2xl font-bold text-slate-900">{submissionStats.reviewed}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-green-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Approuvés</p>
                <p className="text-2xl font-bold text-slate-900">{submissionStats.approved}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Rechercher soumissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Formulaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {transformedFormTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="submitted">Soumis</SelectItem>
                <SelectItem value="reviewed">Révisé</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredSubmissions.map(submission => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSubmission(submission);
                  setDetailOpen(true);
                }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900">{submission.form_name}</h4>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {submission.submitted_by_name}
                        </div>
                        {submission.submission_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(submission.submission_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubmission(submission.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {fillDialogOpen && selectedTemplate && (
        <FormFillDialog
          open={fillDialogOpen}
          onClose={() => {
            setFillDialogOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          jobs={transformedJobs}
          customers={transformedCustomers}
        />
      )}

      {detailOpen && selectedSubmission && (
        <SubmissionDetailDialog
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
        />
      )}
    </div>
  );
}

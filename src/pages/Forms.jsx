import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: formTemplates = [] } = useQuery({
    queryKey: ['formTemplates'],
    queryFn: () => base44.entities.FormTemplate.list(),
    initialData: [],
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list('-submission_date'),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.FormTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id) => base44.entities.FormSubmission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
    },
  });

  const filteredTemplates = formTemplates.filter(t =>
    t.active !== false &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSubmissions = submissions.filter(sub => {
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
    total: formTemplates.length,
    safety: formTemplates.filter(f => f.category === 'safety').length,
    inspection: formTemplates.filter(f => f.category === 'inspection').length,
    active: formTemplates.filter(f => f.active !== false).length,
  };

  const submissionStats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    reviewed: submissions.filter(s => s.status === 'reviewed').length,
    approved: submissions.filter(s => s.status === 'approved').length,
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
    return submissions.filter(s => s.form_template_id === templateId).length;
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un formulaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <Badge variant="outline">
                      {template.fields?.length || 0} champs
                    </Badge>
                    <Badge variant="outline">
                      {getSubmissionCount(template.id)} soumissions
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setFillDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Remplir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Supprimer ce formulaire?')) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun formulaire</h3>
              <p className="text-slate-500 mb-4">Créez votre premier formulaire personnalisé</p>
              <Link to={createPageUrl('FormBuilder')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un formulaire
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{submissionStats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-blue-500">
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

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={formFilter} onValueChange={setFormFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Formulaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous formulaires</SelectItem>
                    {formTemplates.map(form => (
                      <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="submitted">Soumis</SelectItem>
                    <SelectItem value="reviewed">Révisé</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes dates</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">30 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucune soumission</h3>
                  <p className="text-slate-500">Aucune soumission ne correspond à vos filtres</p>
                </CardContent>
              </Card>
            ) : (
              filteredSubmissions.map(submission => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">{submission.form_name}</h3>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status === 'draft' ? 'Brouillon' :
                             submission.status === 'submitted' ? 'Soumis' :
                             submission.status === 'reviewed' ? 'Révisé' :
                             submission.status === 'approved' ? 'Approuvé' : submission.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {submission.submitted_by_name || submission.submitted_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {submission.submission_date && format(new Date(submission.submission_date), 'PPp', { locale: fr })}
                          </span>
                          {submission.signature && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">✓ Signé</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        {submission.pdf_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(submission.pdf_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Supprimer cette soumission ?')) {
                              deleteSubmissionMutation.mutate(submission.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <FormFillDialog
        open={fillDialogOpen}
        onClose={() => {
          setFillDialogOpen(false);
          setSelectedTemplate(null);
        }}
        formTemplate={selectedTemplate}
      />

      <SubmissionDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        formTemplates={formTemplates}
      />
    </div>
  );
}
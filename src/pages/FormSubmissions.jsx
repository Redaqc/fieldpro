import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, User, Eye, Download, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import SubmissionDetailDialog from "@/components/forms/SubmissionDetailDialog";

export default function FormSubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formFilter, setFormFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: submissions = [] } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list('-submission_date'),
    initialData: [],
  });

  const { data: formTemplates = [] } = useQuery({
    queryKey: ['formTemplates'],
    queryFn: () => base44.entities.FormTemplate.list(),
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

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id) => base44.entities.FormSubmission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
    },
  });

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.form_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.submitted_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesForm = formFilter === 'all' || sub.form_template_id === formFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesJob = jobFilter === 'all' || sub.job_id === jobFilter;
    const matchesCustomer = customerFilter === 'all' || sub.customer_id === customerFilter;
    
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
    
    return matchesSearch && matchesForm && matchesStatus && matchesJob && matchesCustomer && matchesDate;
  });

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    reviewed: submissions.filter(s => s.status === 'reviewed').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    draft: submissions.filter(s => s.status === 'draft').length,
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'submitted': return <AlertCircle className="w-4 h-4" />;
      case 'reviewed': return <Eye className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Soumissions de Formulaires</h1>
        <p className="text-slate-500 mt-1">Gérez toutes les soumissions de formulaires</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-slate-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Brouillons</p>
            <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Soumis</p>
            <p className="text-2xl font-bold text-slate-900">{stats.submitted}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Révisés</p>
            <p className="text-2xl font-bold text-slate-900">{stats.reviewed}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Approuvés</p>
            <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher par formulaire ou utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={formFilter} onValueChange={setFormFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Type de formulaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les formulaires</SelectItem>
              {formTemplates.map(form => (
                <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
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
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les jobs</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submissions List */}
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
                        <span className="flex items-center gap-1">
                          {getStatusIcon(submission.status)}
                          {submission.status === 'draft' ? 'Brouillon' :
                           submission.status === 'submitted' ? 'Soumis' :
                           submission.status === 'reviewed' ? 'Révisé' :
                           submission.status === 'approved' ? 'Approuvé' : submission.status}
                        </span>
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
                      {submission.job_id && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Job: {jobs.find(j => j.id === submission.job_id)?.title || submission.job_id}
                        </Badge>
                      )}
                      {submission.customer_id && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Client: {customers.find(c => c.id === submission.customer_id)?.first_name || 'Client'}
                        </Badge>
                      )}
                    </div>

                    {submission.signature && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        ✓ Signé
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewSubmission(submission)}
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
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, Eye, Edit, Trash2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import FormFillDialog from "@/components/forms/FormFillDialog";

export default function Forms() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState(null);
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
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

  const { data: formSubmissions = [] } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list(),
    initialData: [],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.FormTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
    },
  });

  const filteredTemplates = formTemplates.filter(t =>
    t.active !== false &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    return formSubmissions.filter(s => s.form_template_id === templateId).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Formulaires
          </h1>
          <p className="text-slate-500 mt-1">Gérez vos formulaires personnalisés</p>
        </div>
        <Link to={createPageUrl('FormBuilder')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Créer un formulaire
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Templates actifs</p>
          <p className="text-2xl font-bold text-slate-900">{formTemplates.filter(t => t.active).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Soumissions totales</p>
          <p className="text-2xl font-bold text-slate-900">{formSubmissions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-sm text-slate-500">Sécurité</p>
          <p className="text-2xl font-bold text-slate-900">
            {formTemplates.filter(t => t.category === 'safety').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-slate-500">Inspections</p>
          <p className="text-2xl font-bold text-slate-900">
            {formTemplates.filter(t => t.category === 'inspection').length}
          </p>
        </div>
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
          <div key={template.id} className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="p-4 space-y-3">
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
                    setSelectedForm(template);
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
            </div>
          </div>
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

      <FormFillDialog
        open={fillDialogOpen}
        onClose={() => {
          setFillDialogOpen(false);
          setSelectedForm(null);
        }}
        formTemplate={selectedForm}
      />
    </div>
  );
}
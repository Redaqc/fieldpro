import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff, Link2, CheckCircle, XCircle, RefreshCw, Download, AlertCircle, List, Settings as SettingsIcon, GitBranch, Flag, BarChart, FileText, TrendingDown, Paperclip, MessageSquare, Activity, Building2, Image as ImageIcon, Receipt, Upload, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const [editingType, setEditingType] = useState(null);
  const [newType, setNewType] = useState({ name: "", label_fr: "", label_en: "", color: "#0074D9" });
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
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

  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: async () => {
      const info = await base44.entities.CompanyInfo.list();
      return info[0] || null;
    },
  });

  const { data: taxSettings } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const settings = await base44.entities.TaxSettings.list();
      return settings[0] || { taxes: [] };
    },
  });

  const { data: languageSettings } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.LanguageSettings.list();
      return settings[0] || { language: 'fr' };
    },
  });

  const { data: zohoSettings } = useQuery({
    queryKey: ['integrationSettings', 'zoho_books'],
    queryFn: async () => {
      const settings = await base44.entities.IntegrationSettings.filter({ integration_type: 'zoho_books' });
      return settings[0] || null;
    },
  });

  const { data: sage50Settings } = useQuery({
    queryKey: ['integrationSettings', 'sage50'],
    queryFn: async () => {
      const settings = await base44.entities.IntegrationSettings.filter({ integration_type: 'sage50' });
      return settings[0] || null;
    },
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['syncLogs'],
    queryFn: () => base44.entities.SyncLog.list('-created_date', 50),
    initialData: [],
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const updateCompanyInfoMutation = useMutation({
    mutationFn: (data) => {
      if (companyInfo?.id) {
        return base44.entities.CompanyInfo.update(companyInfo.id, data);
      } else {
        return base44.entities.CompanyInfo.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyInfo'] });
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateCompanyInfoMutation.mutate({ logo_url: file_url });
    } catch (error) {
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateTaxSettingsMutation = useMutation({
    mutationFn: (data) => {
      if (taxSettings?.id) {
        return base44.entities.TaxSettings.update(taxSettings.id, data);
      } else {
        return base44.entities.TaxSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
    },
  });

  const addTax = () => {
    const taxes = taxSettings?.taxes || [];
    const newTaxes = [...taxes, { province: '', tax_name: '', rate: '', tax_number: '' }];
    updateTaxSettingsMutation.mutate({ ...taxSettings, taxes: newTaxes });
  };

  const updateTax = (index, field, value) => {
    const taxes = [...(taxSettings?.taxes || [])];
    taxes[index] = { ...taxes[index], [field]: value };
    updateTaxSettingsMutation.mutate({ ...taxSettings, taxes });
  };

  const deleteTax = (index) => {
    const taxes = taxSettings?.taxes?.filter((_, i) => i !== index) || [];
    updateTaxSettingsMutation.mutate({ ...taxSettings, taxes });
  };

  const updateLanguageMutation = useMutation({
    mutationFn: (lang) => {
      if (languageSettings?.id) {
        return base44.entities.LanguageSettings.update(languageSettings.id, { language: lang });
      } else {
        return base44.entities.LanguageSettings.create({ language: lang });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languageSettings'] });
    },
  });

  const connectZohoMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('zohoAuth', { action: 'authorize' });
      window.open(data.auth_url, '_blank', 'width=600,height=700');
    },
  });

  const syncMutation = useMutation({
    mutationFn: async ({ integration, operation, csvData }) => {
      if (integration === 'zoho_books') {
        return await base44.functions.invoke(`zohoSync${operation.charAt(0).toUpperCase() + operation.slice(1)}`);
      } else {
        return await base44.functions.invoke('sage50Sync', { operation, csv_data: csvData });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncLogs'] });
      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
    },
  });

  const handleCSVUpload = async (operation) => {
    if (!csvFile) {
      alert('Veuillez sélectionner un fichier CSV');
      return;
    }

    setUploading(true);
    try {
      const text = await csvFile.text();
      await syncMutation.mutateAsync({
        integration: 'sage50',
        operation,
        csvData: text
      });
      alert('Synchronisation réussie!');
      setCsvFile(null);
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const zohoConnected = zohoSettings?.is_active && zohoSettings?.zoho_access_token;
  const sage50Connected = sage50Settings?.is_active;

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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="language" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Langue
          </TabsTrigger>
          <TabsTrigger value="work-types">Types de travaux</TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Compagnie
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Taxes
          </TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités Jobs</TabsTrigger>
          <TabsTrigger value="checklists">Modèles de checklist</TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            White Label
          </TabsTrigger>
          <TabsTrigger value="menu">Configuration Menu</TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Intégrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>Langue de l'interface / Interface Language</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600">
                Choisissez la langue de l'interface pour tous les utilisateurs. / Choose the interface language for all users.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  variant={languageSettings?.language === 'fr' ? "default" : "outline"}
                  size="lg"
                  onClick={() => updateLanguageMutation.mutate('fr')}
                  className="flex-1 h-24 text-lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🇫🇷</span>
                    <span>Français</span>
                  </div>
                </Button>
                
                <Button
                  variant={languageSettings?.language === 'en' ? "default" : "outline"}
                  size="lg"
                  onClick={() => updateLanguageMutation.mutate('en')}
                  className="flex-1 h-24 text-lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🇬🇧</span>
                    <span>English</span>
                  </div>
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Le changement de langue s'appliquera à tous les utilisateurs de l'application après rechargement de la page.
                </p>
                <p className="text-sm text-blue-900 mt-2">
                  <strong>Note:</strong> The language change will apply to all application users after page reload.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Information de la compagnie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom de l'entreprise</Label>
                <Input
                  value={companyInfo?.company_name || ''}
                  onChange={(e) => updateCompanyInfoMutation.mutate({ company_name: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Adresse</Label>
                <Textarea
                  value={companyInfo?.address || ''}
                  onChange={(e) => updateCompanyInfoMutation.mutate({ address: e.target.value })}
                  placeholder="Adresse complète"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={companyInfo?.phone || ''}
                    onChange={(e) => updateCompanyInfoMutation.mutate({ phone: e.target.value })}
                    placeholder="(123) 456-7890"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={companyInfo?.email || ''}
                    onChange={(e) => updateCompanyInfoMutation.mutate({ email: e.target.value })}
                    placeholder="info@entreprise.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Site web</Label>
                  <Input
                    value={companyInfo?.website || ''}
                    onChange={(e) => updateCompanyInfoMutation.mutate({ website: e.target.value })}
                    placeholder="https://www.entreprise.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Licence</Label>
                  <Input
                    value={companyInfo?.license || ''}
                    onChange={(e) => updateCompanyInfoMutation.mutate({ license: e.target.value })}
                    placeholder="Numéro de licence"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Logo de l'entreprise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyInfo?.logo_url && (
                <div className="flex justify-center p-6 border rounded-lg bg-slate-50">
                  <img 
                    src={companyInfo.logo_url} 
                    alt="Logo" 
                    className="max-h-32 object-contain"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {uploadingLogo ? 'Upload en cours...' : 'Cliquez pour uploader un logo'}
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG ou SVG (max 2MB)</p>
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <Card>
            <CardHeader>
              <CardTitle>Taxes de ventes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Afficher les taxes de vente dans les soumissions</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={taxSettings?.show_taxes_in_quotes === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateTaxSettingsMutation.mutate({ ...taxSettings, show_taxes_in_quotes: true })}
                  >
                    Oui
                  </Button>
                  <Button
                    variant={taxSettings?.show_taxes_in_quotes === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateTaxSettingsMutation.mutate({ ...taxSettings, show_taxes_in_quotes: false })}
                  >
                    Non
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Je fais des achats ou des ventes dans plusieurs provinces</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={taxSettings?.multi_province === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateTaxSettingsMutation.mutate({ ...taxSettings, multi_province: true })}
                  >
                    Oui
                  </Button>
                  <Button
                    variant={taxSettings?.multi_province === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateTaxSettingsMutation.mutate({ ...taxSettings, multi_province: false })}
                  >
                    Non
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-slate-600 mb-4">
                  Entrez toutes les taxes que vous facturez. Vous pourrez ensuite les modifier pour chaque projet si vous avez des clients dans d'autres juridictions.
                </p>

                <div className="space-y-3">
                  {(taxSettings?.taxes || []).map((tax, index) => (
                    <div key={index} className="grid grid-cols-5 gap-3 items-center p-3 border rounded-lg">
                      <Input
                        placeholder="Province"
                        value={tax.province || ''}
                        onChange={(e) => updateTax(index, 'province', e.target.value)}
                      />
                      <Input
                        placeholder="Taxe"
                        value={tax.tax_name || ''}
                        onChange={(e) => updateTax(index, 'tax_name', e.target.value)}
                      />
                      <Input
                        placeholder="Taux"
                        value={tax.rate || ''}
                        onChange={(e) => updateTax(index, 'rate', e.target.value)}
                      />
                      <Input
                        placeholder="Numéro de taxe"
                        value={tax.tax_number || ''}
                        onChange={(e) => updateTax(index, 'tax_number', e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTax(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={addTax}
                  variant="outline"
                  className="w-full mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une autre taxe
                </Button>
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

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>White Label Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600 mb-4">
                Customize the look and feel of your application and customer-facing pages
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      className="w-20"
                    />
                    <Input placeholder="#3b82f6" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      className="w-20"
                    />
                    <Input placeholder="#8b5cf6" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      className="w-20"
                    />
                    <Input placeholder="#10b981" className="flex-1" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Custom Domain</Label>
                <Input
                  placeholder="fieldservice.yourcompany.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Customer Portal Welcome Message</Label>
                <Textarea
                  placeholder="Welcome to our customer portal..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Hide "Powered by Base44"</p>
                  <p className="text-xs text-slate-500">Remove branding from customer-facing pages</p>
                </div>
                <Switch />
              </div>

              <Button className="bg-blue-600 w-full">
                Save Branding Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du menu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Sélectionnez les modules à afficher dans le menu principal
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'dashboard', label: 'Dashboard' },
                  { key: 'dispatcherDashboard', label: 'Dispatcher Dashboard' },
                  { key: 'managerDashboard', label: 'Manager Dashboard' },
                  { key: 'technicianMobile', label: 'Mobile Tech' },
                  { key: 'jobs', label: 'Jobs' },
                  { key: 'serviceCalls', label: 'Service Calls' },
                  { key: 'schedule', label: 'Schedule' },
                  { key: 'scheduleAnalytics', label: 'Schedule Analytics' },
                  { key: 'calendar', label: 'Calendar' },
                  { key: 'customers', label: 'Customers' },
                  { key: 'team', label: 'Team' },
                  { key: 'timeTracking', label: 'Time Tracking' },
                  { key: 'documents', label: 'Documents' },
                  { key: 'forms', label: 'Forms' },
                  { key: 'formAutomations', label: 'Form Automations' },
                  { key: 'recurringJobs', label: 'Recurring Jobs' },
                  { key: 'automationRules', label: 'Automation Rules' },
                  { key: 'reports', label: 'Reports' },
                  { key: 'advancedReports', label: 'Advanced Analytics' },
                  { key: 'customerPortal', label: 'Customer Portal' },
                  { key: 'maintenanceTracker', label: 'Maintenance Tracker' },
                  { key: 'teamChat', label: 'Team Chat' },
                  { key: 'notificationCenter', label: 'Notifications' },
                  { key: 'biDashboard', label: 'BI Dashboard' },
                  { key: 'integrationMarketplace', label: 'Integrations' },
                  { key: 'customFields', label: 'Custom Fields' },
                  { key: 'webhookManager', label: 'Webhooks' },
                  { key: 'profitabilityReports', label: 'Profitability' },
                  { key: 'costsManagement', label: 'Costs Management' },
                  { key: 'gpsTracking', label: 'GPS Tracking' },
                  { key: 'quotations', label: 'Quotations' },
                  { key: 'invoices', label: 'Invoices' },
                  { key: 'assets', label: 'Assets' },
                  { key: 'priceLists', label: 'Price Lists' },
                  { key: 'materials', label: 'Materials' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'roleManager', label: 'Role Manager' }
                ].map(module => (
                  <div key={module.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <span className="text-sm font-medium">{module.label}</span>
                    <Switch
                      checked={appSettings?.menu_modules?.[module.key] !== false}
                      onCheckedChange={(checked) => {
                        const currentModules = appSettings?.menu_modules || {};
                        updateAppSettingsMutation.mutate({
                          menu_modules: {
                            ...currentModules,
                            [module.key]: checked
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Pour gérer les intégrations tierces (QuickBooks, Google Calendar, etc.), visitez la page <a href="/IntegrationMarketplace" className="underline font-semibold">Integration Marketplace</a>.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>Webhooks:</strong> Configurez des webhooks personnalisés sur la page <a href="/WebhookManager" className="underline font-semibold">Webhook Manager</a>.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>Champs personnalisés:</strong> Ajoutez des champs personnalisés aux entités sur la page <a href="/CustomFields" className="underline font-semibold">Custom Fields</a>.
              </p>
            </div>
          </div>

          <Tabs defaultValue="zoho" className="space-y-4">
            <TabsList>
              <TabsTrigger value="zoho">Zoho Books</TabsTrigger>
              <TabsTrigger value="sage50">Sage 50 Canada</TabsTrigger>
              <TabsTrigger value="advanced">Configuration Avancée</TabsTrigger>
              <TabsTrigger value="logs">Journal d'activité</TabsTrigger>
            </TabsList>

            <TabsContent value="zoho">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Connexion Zoho Books</span>
                      {zohoConnected ? (
                        <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Connecté</Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="w-4 h-4 mr-1" />Déconnecté</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {zohoConnected ? (
                      <>
                        <div className="text-sm space-y-2">
                          <p><strong>Organisation:</strong> {zohoSettings.zoho_organization_id}</p>
                          <p><strong>Dernier sync manuel:</strong> {zohoSettings.last_sync_customers ? format(new Date(zohoSettings.last_sync_customers), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
                          <p><strong>Dernier sync auto:</strong> {zohoSettings.last_auto_sync ? format(new Date(zohoSettings.last_auto_sync), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-semibold">Sync Automatique</Label>
                            <Switch
                              checked={zohoSettings.auto_sync_enabled || false}
                              onCheckedChange={(checked) => {
                                base44.entities.IntegrationSettings.update(zohoSettings.id, { auto_sync_enabled: checked });
                                queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                              }}
                            />
                          </div>

                          {zohoSettings.auto_sync_enabled && (
                            <>
                              <div className="space-y-2">
                                <Label>Fréquence</Label>
                                <Select
                                  value={zohoSettings.sync_frequency || 'daily'}
                                  onValueChange={(value) => {
                                    base44.entities.IntegrationSettings.update(zohoSettings.id, { sync_frequency: value });
                                    queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                                    <SelectItem value="daily">Quotidien</SelectItem>
                                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(zohoSettings.sync_frequency === 'daily' || zohoSettings.sync_frequency === 'weekly') && (
                                <div className="space-y-2">
                                  <Label>Heure de sync</Label>
                                  <Input
                                    type="time"
                                    value={zohoSettings.sync_time || '02:00'}
                                    onChange={(e) => {
                                      base44.entities.IntegrationSettings.update(zohoSettings.id, { sync_time: e.target.value });
                                      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                    }}
                                  />
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label>Opérations à synchroniser</Label>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Clients</span>
                                  <Switch
                                    checked={zohoSettings.sync_customers !== false}
                                    onCheckedChange={(checked) => {
                                      base44.entities.IntegrationSettings.update(zohoSettings.id, { sync_customers: checked });
                                      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Factures</span>
                                  <Switch
                                    checked={zohoSettings.sync_invoices !== false}
                                    onCheckedChange={(checked) => {
                                      base44.entities.IntegrationSettings.update(zohoSettings.id, { sync_invoices: checked });
                                      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Items</span>
                                  <Switch
                                    checked={zohoSettings.sync_items !== false}
                                    onCheckedChange={(checked) => {
                                      base44.entities.IntegrationSettings.update(zohoSettings.id, { sync_items: checked });
                                      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm">Notifier en cas d'erreur</span>
                                <Switch
                                  checked={zohoSettings.notify_on_errors !== false}
                                  onCheckedChange={(checked) => {
                                    base44.entities.IntegrationSettings.update(zohoSettings.id, { notify_on_errors: checked });
                                    queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <Button 
                          onClick={() => base44.entities.IntegrationSettings.update(zohoSettings.id, { is_active: false })}
                          variant="outline"
                          className="w-full"
                        >
                          Déconnecter
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => connectZohoMutation.mutate()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <strong>Connecter Zoho Books</strong>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Synchronisation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => syncMutation.mutate({ integration: 'zoho_books', operation: 'customers' })}
                      disabled={!zohoConnected || syncMutation.isPending}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <strong>Sync Clients</strong>
                    </Button>

                    <Button
                      onClick={() => syncMutation.mutate({ integration: 'zoho_books', operation: 'invoices' })}
                      disabled={!zohoConnected || syncMutation.isPending}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <strong>Sync Factures</strong>
                    </Button>

                    <Button
                      onClick={() => syncMutation.mutate({ integration: 'zoho_books', operation: 'items' })}
                      disabled={!zohoConnected || syncMutation.isPending}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <strong>Sync Items</strong>
                    </Button>

                    {syncMutation.isPending && (
                      <div className="text-sm text-blue-600 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Synchronisation en cours...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sage50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Connexion Sage 50</span>
                      {sage50Connected ? (
                        <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Actif</Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="w-4 h-4 mr-1" />Inactif</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-semibold mb-1">Mode CSV activé</p>
                          <p>Importez et exportez vos données via des fichiers CSV compatibles Sage 50 Canada.</p>
                        </div>
                      </div>
                    </div>

                    {sage50Settings ? (
                      <>
                        <div className="text-sm space-y-2">
                          <p><strong>Mode:</strong> {sage50Settings.sage50_sync_mode?.toUpperCase()}</p>
                          <p><strong>Dernier sync:</strong> {sage50Settings.last_sync_customers ? format(new Date(sage50Settings.last_sync_customers), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-semibold">Sync Automatique</Label>
                            <Switch
                              checked={sage50Settings.auto_sync_enabled || false}
                              onCheckedChange={(checked) => {
                                base44.entities.IntegrationSettings.update(sage50Settings.id, { auto_sync_enabled: checked });
                                queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                              }}
                            />
                          </div>

                          {sage50Settings.auto_sync_enabled && (
                            <>
                              <div className="space-y-2">
                                <Label>Fréquence</Label>
                                <Select
                                  value={sage50Settings.sync_frequency || 'daily'}
                                  onValueChange={(value) => {
                                    base44.entities.IntegrationSettings.update(sage50Settings.id, { sync_frequency: value });
                                    queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                                    <SelectItem value="daily">Quotidien</SelectItem>
                                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm">Notifier en cas d'erreur</span>
                                <Switch
                                  checked={sage50Settings.notify_on_errors !== false}
                                  onCheckedChange={(checked) => {
                                    base44.entities.IntegrationSettings.update(sage50Settings.id, { notify_on_errors: checked });
                                    queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <Button
                        onClick={async () => {
                          await base44.entities.IntegrationSettings.create({
                            integration_type: 'sage50',
                            sage50_sync_mode: 'csv',
                            is_active: true
                          });
                          queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                        }}
                        className="w-full"
                      >
                        <strong>Activer Sage 50</strong>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Import/Export CSV</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Fichier CSV</label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files[0])}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() => handleCSVUpload('customers')}
                        disabled={!csvFile || uploading}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        <strong>Clients</strong>
                      </Button>

                      <Button
                        onClick={() => handleCSVUpload('items')}
                        disabled={!csvFile || uploading}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        <strong>Items</strong>
                      </Button>

                      <Button
                        onClick={() => handleCSVUpload('invoices')}
                        disabled={!csvFile || uploading}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        <strong>Factures</strong>
                      </Button>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                      <FileText className="w-4 h-4 mb-2" />
                      <p className="font-semibold mb-1">Format CSV requis:</p>
                      <p>Clients: first_name, last_name, email, phone, company, address, city, province, postal_code</p>
                      <p>Items: item_code, item_name, price, description</p>
                      <p>Factures: invoice_number, customer_name, date, subtotal, gst, pst, total</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-6">
                {/* Date Ranges */}
                <Card>
                  <CardHeader>
                    <CardTitle>Plages de dates pour import historique</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Définissez une plage de dates pour limiter l'import des données historiques
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Input
                          type="date"
                          value={zohoSettings?.historical_sync_start_date || ''}
                          onChange={(e) => {
                            if (zohoSettings) {
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                                historical_sync_start_date: e.target.value 
                              });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Input
                          type="date"
                          value={zohoSettings?.historical_sync_end_date || ''}
                          onChange={(e) => {
                            if (zohoSettings) {
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                                historical_sync_end_date: e.target.value 
                              });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Master Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle>Règles de maîtrise des données</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Définissez quel système est la source principale pour chaque type de données
                    </p>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label>Clients</Label>
                        <Select
                          value={zohoSettings?.master_rules?.customers || 'bidirectional'}
                          onValueChange={(value) => {
                            if (zohoSettings) {
                              const rules = { ...(zohoSettings.master_rules || {}), customers: value };
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { master_rules: rules });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">Système maître</SelectItem>
                            <SelectItem value="external">Externe maître (Zoho/Sage)</SelectItem>
                            <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label>Factures</Label>
                        <Select
                          value={zohoSettings?.master_rules?.invoices || 'system'}
                          onValueChange={(value) => {
                            if (zohoSettings) {
                              const rules = { ...(zohoSettings.master_rules || {}), invoices: value };
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { master_rules: rules });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">Système maître</SelectItem>
                            <SelectItem value="external">Externe maître (Zoho/Sage)</SelectItem>
                            <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label>Items / Matériaux</Label>
                        <Select
                          value={zohoSettings?.master_rules?.items || 'external'}
                          onValueChange={(value) => {
                            if (zohoSettings) {
                              const rules = { ...(zohoSettings.master_rules || {}), items: value };
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { master_rules: rules });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">Système maître</SelectItem>
                            <SelectItem value="external">Externe maître (Zoho/Sage)</SelectItem>
                            <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label>Paiements</Label>
                        <Select
                          value={zohoSettings?.master_rules?.payments || 'external'}
                          onValueChange={(value) => {
                            if (zohoSettings) {
                              const rules = { ...(zohoSettings.master_rules || {}), payments: value };
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { master_rules: rules });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">Système maître</SelectItem>
                            <SelectItem value="external">Externe maître (Zoho/Sage)</SelectItem>
                            <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label>Résolution des conflits</Label>
                        <Select
                          value={zohoSettings?.conflict_resolution || 'use_latest'}
                          onValueChange={(value) => {
                            if (zohoSettings) {
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { conflict_resolution: value });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="use_latest">Utiliser le plus récent</SelectItem>
                            <SelectItem value="use_external">Toujours externe</SelectItem>
                            <SelectItem value="use_system">Toujours système</SelectItem>
                            <SelectItem value="manual">Manuel (avec log)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtres de synchronisation - Clients</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Statuts à synchroniser</Label>
                      <div className="flex gap-2">
                        {['active', 'inactive', 'vip'].map(status => (
                          <label key={status} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(zohoSettings?.customer_filters?.status || ['active']).includes(status)}
                              onChange={(e) => {
                                if (zohoSettings) {
                                  const current = zohoSettings.customer_filters?.status || ['active'];
                                  const updated = e.target.checked 
                                    ? [...current, status]
                                    : current.filter(s => s !== status);
                                  base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                                    customer_filters: { ...(zohoSettings.customer_filters || {}), status: updated }
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                }
                              }}
                            />
                            <span className="text-sm capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Emails à exclure (un par ligne)</Label>
                      <Textarea
                        placeholder="test@example.com&#10;spam@example.com"
                        rows={3}
                        value={(zohoSettings?.customer_filters?.exclude_emails || []).join('\n')}
                        onChange={(e) => {
                          if (zohoSettings) {
                            const emails = e.target.value.split('\n').filter(e => e.trim());
                            base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                              customer_filters: { ...(zohoSettings.customer_filters || {}), exclude_emails: emails }
                            });
                            queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Item Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtres de synchronisation - Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Items actifs uniquement</Label>
                      <Switch
                        checked={zohoSettings?.item_filters?.active_only !== false}
                        onCheckedChange={(checked) => {
                          if (zohoSettings) {
                            base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                              item_filters: { ...(zohoSettings.item_filters || {}), active_only: checked }
                            });
                            queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                          }
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prix minimum</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={zohoSettings?.item_filters?.min_price || ''}
                          onChange={(e) => {
                            if (zohoSettings) {
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                                item_filters: { ...(zohoSettings.item_filters || {}), min_price: parseFloat(e.target.value) || 0 }
                              });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Prix maximum</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Illimité"
                          value={zohoSettings?.item_filters?.max_price || ''}
                          onChange={(e) => {
                            if (zohoSettings) {
                              base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                                item_filters: { ...(zohoSettings.item_filters || {}), max_price: parseFloat(e.target.value) || null }
                              });
                              queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtres de synchronisation - Factures</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Statuts à synchroniser</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['paid', 'pending', 'overdue'].map(status => (
                          <label key={status} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(zohoSettings?.invoice_filters?.statuses || ['paid', 'pending']).includes(status)}
                              onChange={(e) => {
                                if (zohoSettings) {
                                  const current = zohoSettings.invoice_filters?.statuses || ['paid', 'pending'];
                                  const updated = e.target.checked 
                                    ? [...current, status]
                                    : current.filter(s => s !== status);
                                  base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                                    invoice_filters: { ...(zohoSettings.invoice_filters || {}), statuses: updated }
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                                }
                              }}
                            />
                            <span className="text-sm capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Montant minimum</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={zohoSettings?.invoice_filters?.min_amount || ''}
                        onChange={(e) => {
                          if (zohoSettings) {
                            base44.entities.IntegrationSettings.update(zohoSettings.id, { 
                              invoice_filters: { ...(zohoSettings.invoice_filters || {}), min_amount: parseFloat(e.target.value) || 0 }
                            });
                            queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Journal d'activité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {syncLogs.map(log => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={
                                log.status === 'success' ? 'bg-green-500' :
                                log.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                              }>
                                {log.status === 'success' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                                 log.status === 'error' ? <XCircle className="w-3 h-3 mr-1" /> :
                                 <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                                {log.status}
                              </Badge>
                              <span className="font-semibold text-slate-900">{log.operation}</span>
                              <Badge variant="outline">{log.integration_type}</Badge>
                            </div>

                            <div className="text-sm text-slate-600 grid grid-cols-4 gap-4">
                              <div>
                                <span className="font-medium">Traités:</span> {log.records_processed}
                              </div>
                              <div>
                                <span className="font-medium">Créés:</span> {log.records_created}
                              </div>
                              <div>
                                <span className="font-medium">Mis à jour:</span> {log.records_updated}
                              </div>
                              <div>
                                <span className="font-medium">Échecs:</span> {log.records_failed}
                              </div>
                            </div>

                            {log.error_message && (
                              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                {log.error_message}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 text-right">
                            <div>{format(new Date(log.created_date), 'dd/MM/yyyy')}</div>
                            <div>{format(new Date(log.created_date), 'HH:mm:ss')}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {syncLogs.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        Aucune activité de synchronisation
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        </Tabs>
        </div>
        );
        }
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff, Link2, CheckCircle, XCircle, RefreshCw, Download, AlertCircle, List, Settings as SettingsIcon, GitBranch, Flag, BarChart, FileText, TrendingDown, Paperclip, MessageSquare, Activity, Building2, Image as ImageIcon, Receipt, Upload, Palette, Shield, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddressAutocompleteInput from "@/components/shared/AddressAutocompleteInput";


// Address Autocomplete Tab Component
function AddressAutocompleteTab() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('AIzaSyAhVb41m9MwDmI_D0YelvxdNNkAdfTJBc4');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testAddress, setTestAddress] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [maxResults, setMaxResults] = useState(8);

  const { data: addressSettings, isLoading } = useQuery({
    queryKey: ['integrationSettings', 'address_autocomplete'],
    queryFn: async () => {
      const settings = await base44.entities.IntegrationSettings.filter({ 
        integration_type: 'address_autocomplete' 
      });
      return settings[0] || null;
    },
  });

  // Auto-create settings with API key if not exists
  React.useEffect(() => {
    const initSettings = async () => {
      if (!isLoading && !addressSettings) {
        try {
          await base44.entities.IntegrationSettings.create({
            integration_type: 'address_autocomplete',
            provider_type: 'google',
            api_key: 'AIzaSyAhVb41m9MwDmI_D0YelvxdNNkAdfTJBc4',
            country_bias: 'ca',
            language: 'fr',
            is_active: true,
            max_results: 8
          });
          queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
        } catch (error) {
          console.error('Failed to create settings:', error);
        }
      }
    };
    initSettings();
  }, [isLoading, addressSettings]);

  // Sync local state with DB
  React.useEffect(() => {
    if (addressSettings) {
      if (addressSettings.api_key) setApiKey(addressSettings.api_key);
      if (addressSettings.max_results) setMaxResults(addressSettings.max_results);
    }
  }, [addressSettings?.id]);

  const saveSettings = async (updates) => {
    setIsSaving(true);
    try {
      const fullData = {
        integration_type: 'address_autocomplete',
        provider_type: addressSettings?.provider_type || 'google',
        country_bias: addressSettings?.country_bias || 'ca',
        language: addressSettings?.language || 'fr',
        is_active: addressSettings?.is_active || false,
        api_key: addressSettings?.api_key || '',
        max_results: addressSettings?.max_results || 8,
        ...updates
      };

      if (addressSettings?.id) {
        await base44.entities.IntegrationSettings.update(addressSettings.id, fullData);
      } else {
        await base44.entities.IntegrationSettings.create(fullData);
      }

      await queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
      alert('✓ Configuration sauvegardée avec succès!');
    } catch (error) {
      alert('✗ Erreur: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    await saveSettings({
      api_key: apiKey,
      max_results: maxResults
    });
  };

  const handleTestAutocomplete = async () => {
    if (!testAddress.trim()) {
      setTestResults({ error: 'Veuillez entrer une adresse à tester' });
      return;
    }

    if (!addressSettings?.api_key) {
      setTestResults({ 
        error: 'Aucune clé API configurée.',
        instruction: 'Veuillez d\'abord sauvegarder votre clé API.'
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    try {
      const response = await base44.functions.invoke('addressAutocomplete', {
        query: testAddress,
        sessionToken: Math.random().toString(36)
      });

      if (response?.data?.error) {
        setTestResults({
          error: response.data.error,
          instruction: response.data.instruction || 'Vérifiez votre configuration'
        });
      } else if (response?.data?.suggestions) {
        setTestResults({
          success: true,
          suggestions: response.data.suggestions,
          message: `✓ Configuration valide ! ${response.data.suggestions.length} suggestions trouvées.`
        });
      } else {
        setTestResults({
          error: 'Aucune suggestion trouvée',
          instruction: 'Vérifiez que votre clé API a les permissions nécessaires'
        });
      }
    } catch (error) {
      setTestResults({
        error: 'Erreur de test',
        instruction: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Address Autocomplete</CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            Configurez le fournisseur d'autocomplétion d'adresses pour votre application
          </p>
        </CardHeader>
      </Card>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Sélection du fournisseur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => saveSettings({ provider_type: 'google' })}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                addressSettings?.provider_type === 'google'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Google Places API</h3>
                  <p className="text-xs text-slate-500">Recommandé • Haute précision</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Service de Google Maps avec couverture mondiale et données détaillées
              </p>
            </button>

            <button
              onClick={() => saveSettings({ provider_type: 'mapbox' })}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                addressSettings?.provider_type === 'mapbox'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Mapbox Geocoding</h3>
                  <p className="text-xs text-slate-500">Alternative • Open source</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                API moderne avec tarifs compétitifs et options personnalisables
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Identifiants API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Clé API / Access Token</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={addressSettings?.api_key ? maskApiKey(addressSettings.api_key) : "Entrez votre clé API"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {addressSettings?.provider_type === 'mapbox' ? (
                <>
                  <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                    Obtenez votre token Mapbox →
                  </a>
                </>
              ) : (
                <>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                    Obtenez votre clé Google →
                  </a>
                  <span className="text-slate-400 mx-1">•</span>
                  Activez "Places API" dans votre projet
                </>
              )}
            </p>
            {addressSettings?.api_key && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-green-600 font-medium">Clé API enregistrée</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Activer l'autocomplétion</p>
              <p className="text-xs text-slate-500">Rendre disponible dans toute l'application</p>
            </div>
            <Switch
              checked={addressSettings?.is_active || false}
              onCheckedChange={(checked) => saveSettings({ is_active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Options régionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pays par défaut</Label>
              <Select
                value={addressSettings?.country_bias || 'ca'}
                onValueChange={(value) => saveSettings({ country_bias: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                  <SelectItem value="us">🇺🇸 États-Unis</SelectItem>
                  <SelectItem value="fr">🇫🇷 France</SelectItem>
                  <SelectItem value="gb">🇬🇧 Royaume-Uni</SelectItem>
                  <SelectItem value="mx">🇲🇽 Mexique</SelectItem>
                  <SelectItem value="de">🇩🇪 Allemagne</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Priorise les résultats de ce pays
              </p>
            </div>

            <div>
              <Label>Langue des résultats</Label>
              <Select
                value={addressSettings?.language || 'fr'}
                onValueChange={(value) => saveSettings({ language: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Langue d'affichage des adresses
              </p>
            </div>
          </div>

          <div>
            <Label>Nombre maximum de suggestions</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 8)}
              className="mt-1 w-32"
            />
            <p className="text-xs text-slate-500 mt-1">
              Entre 1 et 20 résultats (recommandé: 8)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Tester la configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Adresse de test</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ex: 123 rue principale, Montreal"
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestAutocomplete()}
                className="flex-1"
              />
              <Button
                onClick={handleTestAutocomplete}
                disabled={isTesting || !testAddress.trim()}
              >
                {isTesting ? 'Test...' : 'Tester'}
              </Button>
            </div>
          </div>

          {testResults && (
            <div className={`p-4 rounded-lg border ${
              testResults.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {testResults.success ? (
                <>
                  <p className="text-sm font-medium text-green-900 mb-2">
                    {testResults.message}
                  </p>
                  <div className="space-y-1">
                    {testResults.suggestions.slice(0, 5).map((s, i) => (
                      <div key={i} className="text-xs text-green-700 bg-white px-2 py-1 rounded">
                        {s.description}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-900">
                    ✗ {testResults.error}
                  </p>
                  {testResults.instruction && (
                    <p className="text-xs text-red-700 mt-1">
                      {testResults.instruction}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving || !apiKey.trim()}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder la configuration'}
        </Button>
        
        {addressSettings?.api_key && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configuré
          </Badge>
        )}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Où sera utilisée l'autocomplétion ?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Formulaires de création/édition de clients</li>
                <li>Emplacements de projets (Jobs)</li>
                <li>Adresses d'appels de service</li>
                <li>Toute saisie d'adresse dans l'application</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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
  const [companyFormData, setCompanyFormData] = useState({});

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

  // Sync form data with loaded company info
  React.useEffect(() => {
    if (companyInfo) {
      setCompanyFormData(companyInfo);
    }
  }, [companyInfo?.id]);

  // Debounced update function
  const debouncedUpdateRef = React.useRef(null);
  const handleCompanyFieldChange = (field, value) => {
    const newData = { ...companyFormData, [field]: value };
    setCompanyFormData(newData);

    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }

    debouncedUpdateRef.current = setTimeout(() => {
      updateCompanyInfoMutation.mutate({ [field]: value });
    }, 800);
  };

  const handleAddressSelected = (addressDetails) => {
    const updates = {
      address: addressDetails.full_address || '',
      city: addressDetails.city || '',
      province: addressDetails.province || '',
      postal_code: addressDetails.postal_code || ''
    };
    setCompanyFormData({ ...companyFormData, ...updates });
    updateCompanyInfoMutation.mutate(updates);
  };

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
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Center
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
          <TabsTrigger value="address-autocomplete">Address Autocomplete</TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-slate-500" />
                <div>
                  <CardTitle>Security Center</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Manage your account security settings</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-lg font-semibold">Two-factor authentication (2FA)</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Protect your account's sensitive information by adding an extra step to the login process.{' '}
                    <a href="#" className="text-blue-600 hover:underline">Learn More</a>
                  </p>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50">
                  <Switch
                    checked={appSettings?.require_2fa || false}
                    onCheckedChange={(checked) => updateAppSettingsMutation.mutate({ require_2fa: checked })}
                  />
                  <div className="flex-1">
                    <p className="font-medium">Require Two-factor authentication (2FA)</p>
                    <p className="text-sm text-slate-600 mt-1">
                      When this is selected you'll be required to use 2FA to log in with a one-time code from your phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Notifications */}
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-lg font-semibold">Security notifications</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Get email notifications about every sensitive action made in your account
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-medium text-sm">Notify me about...</p>
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Switch
                      checked={appSettings?.notify_phone_change || false}
                      onCheckedChange={(checked) => updateAppSettingsMutation.mutate({ notify_phone_change: checked })}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Changes to a user's phone number</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <Switch
                      checked={appSettings?.notify_email_change || false}
                      onCheckedChange={(checked) => updateAppSettingsMutation.mutate({ notify_email_change: checked })}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Changes to a user's email address</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
              <p className="text-sm text-slate-500 mt-2">
                Ces informations apparaîtront sur vos documents, factures et soumissions
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div>
                <Label className="text-base font-semibold">Nom de l'entreprise</Label>
                <Input
                  value={companyFormData?.company_name || ''}
                  onChange={(e) => handleCompanyFieldChange('company_name', e.target.value)}
                  placeholder="Nom de l'entreprise"
                  className="mt-2 h-11"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Coordonnées</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Téléphone principal</Label>
                    <Input
                      value={companyFormData?.phone || ''}
                      onChange={(e) => handleCompanyFieldChange('phone', e.target.value)}
                      placeholder="(514) 123-4567"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Email de contact</Label>
                    <Input
                      type="email"
                      value={companyFormData?.email || ''}
                      onChange={(e) => handleCompanyFieldChange('email', e.target.value)}
                      placeholder="contact@entreprise.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Télécopieur (Fax)</Label>
                    <Input
                      value={companyFormData?.fax || ''}
                      onChange={(e) => handleCompanyFieldChange('fax', e.target.value)}
                      placeholder="(514) 123-4568"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Site web</Label>
                    <Input
                      value={companyFormData?.website || ''}
                      onChange={(e) => handleCompanyFieldChange('website', e.target.value)}
                      placeholder="https://www.entreprise.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Adresse</h3>

                <AddressAutocompleteInput
                  label="Adresse complète"
                  placeholder="Commencez à taper l'adresse de votre entreprise..."
                  value={companyFormData?.address || ''}
                  onChange={(e) => handleCompanyFieldChange('address', e.target.value)}
                  onAddressSelected={handleAddressSelected}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Ville</Label>
                    <Input
                      value={companyFormData?.city || ''}
                      onChange={(e) => handleCompanyFieldChange('city', e.target.value)}
                      placeholder="Montréal"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Province</Label>
                    <Select
                      value={companyFormData?.province || ''}
                      onValueChange={(value) => handleCompanyFieldChange('province', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QC">Québec</SelectItem>
                        <SelectItem value="ON">Ontario</SelectItem>
                        <SelectItem value="BC">Colombie-Britannique</SelectItem>
                        <SelectItem value="AB">Alberta</SelectItem>
                        <SelectItem value="MB">Manitoba</SelectItem>
                        <SelectItem value="SK">Saskatchewan</SelectItem>
                        <SelectItem value="NS">Nouvelle-Écosse</SelectItem>
                        <SelectItem value="NB">Nouveau-Brunswick</SelectItem>
                        <SelectItem value="PE">Île-du-Prince-Édouard</SelectItem>
                        <SelectItem value="NL">Terre-Neuve-et-Labrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Code postal</Label>
                    <Input
                      value={companyFormData?.postal_code || ''}
                      onChange={(e) => handleCompanyFieldChange('postal_code', e.target.value.toUpperCase())}
                      placeholder="H1A 1A1"
                      className="mt-1"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Legal Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Informations légales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Numéro de licence RBQ</Label>
                    <Input
                      value={companyFormData?.license || ''}
                      onChange={(e) => handleCompanyFieldChange('license', e.target.value)}
                      placeholder="1234-5678-01"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>NEQ (Numéro d'entreprise du Québec)</Label>
                    <Input
                      value={companyFormData?.neq || ''}
                      onChange={(e) => handleCompanyFieldChange('neq', e.target.value)}
                      placeholder="1234567890"
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <Label>Numéro TPS</Label>
                    <Input
                      value={companyFormData?.gst_number || ''}
                      onChange={(e) => handleCompanyFieldChange('gst_number', e.target.value)}
                      placeholder="123456789 RT 0001"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Numéro TVQ</Label>
                    <Input
                      value={companyFormData?.qst_number || ''}
                      onChange={(e) => handleCompanyFieldChange('qst_number', e.target.value)}
                      placeholder="1234567890 TQ 0001"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Informations additionnelles</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Année de fondation</Label>
                    <Input
                      type="number"
                      value={companyFormData?.founding_year || ''}
                      onChange={(e) => handleCompanyFieldChange('founding_year', e.target.value)}
                      placeholder="2020"
                      className="mt-1"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <Label>Nombre d'employés</Label>
                    <Input
                      type="number"
                      value={companyFormData?.employee_count || ''}
                      onChange={(e) => handleCompanyFieldChange('employee_count', e.target.value)}
                      placeholder="10"
                      className="mt-1"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description de l'entreprise</Label>
                  <Textarea
                    value={companyFormData?.description || ''}
                    onChange={(e) => handleCompanyFieldChange('description', e.target.value)}
                    placeholder="Décrivez votre entreprise, vos services et votre expertise..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">💡 Conseil</p>
                    <p>Ces informations seront automatiquement incluses dans vos factures, soumissions et autres documents officiels. Assurez-vous qu'elles sont à jour et exactes.</p>
                  </div>
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

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium">Utilisation de matériaux</p>
                      <p className="text-xs text-slate-500">Suivre les matériaux consommés</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_material_usage !== false}
                    onCheckedChange={() => toggleFeature('feature_material_usage', appSettings?.feature_material_usage !== false)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Assignment d'actifs</p>
                      <p className="text-xs text-slate-500">Assigner des équipements aux jobs</p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.feature_asset_assignment !== false}
                    onCheckedChange={() => toggleFeature('feature_asset_assignment', appSettings?.feature_asset_assignment !== false)}
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

        <TabsContent value="address-autocomplete">
          <AddressAutocompleteTab />
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


        </Tabs>
        </div>
        );
        }
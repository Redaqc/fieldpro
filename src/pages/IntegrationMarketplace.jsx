import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Zap, Calendar, Mail, DollarSign, Webhook, CheckCircle, RefreshCw, Upload, FileText, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const INTEGRATIONS = [
  {
    type: 'zoho_books',
    name: 'Zoho Books',
    description: 'Sync customers, invoices and items with Zoho Books',
    icon: DollarSign,
    color: 'text-blue-600',
    features: ['Customer sync', 'Invoice sync', 'Items sync', 'Auto-sync', 'Advanced filters']
  },
  {
    type: 'sage50',
    name: 'Sage 50 Canada',
    description: 'Import/export data via CSV files',
    icon: FileText,
    color: 'text-green-600',
    features: ['CSV import/export', 'Customer sync', 'Items sync', 'Invoice sync']
  },
  {
    type: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync customers and invoices with QuickBooks',
    icon: DollarSign,
    color: 'text-green-600',
    features: ['Customer sync', 'Invoice sync', 'Payment tracking']
  },
  {
    type: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync jobs to Google Calendar',
    icon: Calendar,
    color: 'text-blue-600',
    features: ['Job scheduling', 'Technician calendars', 'Reminders']
  },
  {
    type: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    icon: Mail,
    color: 'text-yellow-600',
    features: ['Customer lists', 'Email campaigns', 'Analytics']
  },
  {
    type: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps',
    icon: Zap,
    color: 'text-orange-600',
    features: ['Unlimited workflows', 'Multi-step zaps', 'Custom triggers']
  },
  {
    type: 'custom_webhook',
    name: 'Custom Webhooks',
    description: 'Create custom integrations',
    icon: Webhook,
    color: 'text-purple-600',
    features: ['Real-time events', 'Custom payloads', 'Secure signatures']
  }
];

export default function IntegrationMarketplace() {
  const [configDialog, setConfigDialog] = useState(null);
  const [configData, setConfigData] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.Integration.list(),
    initialData: [],
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

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const existing = integrations.find(i => i.type === data.type);
      if (existing) {
        return base44.entities.Integration.update(existing.id, data);
      }
      return base44.entities.Integration.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setConfigDialog(null);
      setConfigData({});
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Integration.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
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

  const getIntegrationStatus = (type) => {
    if (type === 'zoho_books') {
      return zohoConnected ? 'active' : 'inactive';
    }
    if (type === 'sage50') {
      return sage50Connected ? 'active' : 'inactive';
    }
    const integration = integrations.find(i => i.type === type);
    return integration?.status || 'inactive';
  };

  const handleConfigure = (integrationType) => {
    if (integrationType === 'zoho_books' || integrationType === 'sage50') {
      setConfigDialog(integrationType);
      return;
    }
    const existing = integrations.find(i => i.type === integrationType);
    setConfigData(existing || { type: integrationType, name: integrationType });
    setConfigDialog(integrationType);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Integration Marketplace</h1>
        <p className="text-slate-500 mt-1">Connect your favorite tools and services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const status = getIntegrationStatus(integration.type);
          const activeIntegration = integrations.find(i => i.type === integration.type);

          return (
            <Card key={integration.type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-slate-50 ${integration.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge 
                        variant={status === 'active' ? 'default' : 'secondary'}
                        className={status === 'active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>
                  {activeIntegration && (
                    <Switch
                      checked={status === 'active'}
                      onCheckedChange={(checked) => {
                        toggleMutation.mutate({
                          id: activeIntegration.id,
                          status: checked ? 'active' : 'inactive'
                        });
                      }}
                    />
                  )}
                </div>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {integration.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleConfigure(integration.type)}
                  variant="outline"
                  className="w-full"
                >
                  {status === 'active' ? 'Configure' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {configDialog}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {configDialog === 'zoho_books' && (
              <Tabs defaultValue="connection" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="connection">Connexion</TabsTrigger>
                  <TabsTrigger value="sync">Synchronisation</TabsTrigger>
                  <TabsTrigger value="advanced">Avancé</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="connection">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      {zohoConnected ? (
                        <>
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-900">Connecté à Zoho Books</span>
                            </div>
                            <Badge className="bg-green-500">Active</Badge>
                          </div>
                          
                          <div className="text-sm space-y-2">
                            <p><strong>Organisation:</strong> {zohoSettings.zoho_organization_id}</p>
                            <p><strong>Dernier sync:</strong> {zohoSettings.last_sync_customers ? format(new Date(zohoSettings.last_sync_customers), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
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
                          Connecter Zoho Books
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sync">
                  <Card>
                    <CardContent className="space-y-3 pt-6">
                      <Button
                        onClick={() => syncMutation.mutate({ integration: 'zoho_books', operation: 'customers' })}
                        disabled={!zohoConnected || syncMutation.isPending}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Clients
                      </Button>

                      <Button
                        onClick={() => syncMutation.mutate({ integration: 'zoho_books', operation: 'invoices' })}
                        disabled={!zohoConnected || syncMutation.isPending}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Factures
                      </Button>

                      <Button
                        onClick={() => syncMutation.mutate({ integration: 'zoho_books', operation: 'items' })}
                        disabled={!zohoConnected || syncMutation.isPending}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Items
                      </Button>

                      {syncMutation.isPending && (
                        <div className="text-sm text-blue-600 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Synchronisation en cours...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced">
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Filtres de synchronisation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Statuts clients à synchroniser</Label>
                          <div className="flex gap-2">
                            {['active', 'inactive', 'vip'].map(status => (
                              <label key={status} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer text-sm">
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
                                <span className="capitalize">{status}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="logs">
                  <Card>
                    <CardContent className="space-y-3 pt-6 max-h-[60vh] overflow-y-auto">
                      {syncLogs.filter(log => log.integration_type === 'zoho_books').map(log => (
                        <div key={log.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                                {log.status}
                              </Badge>
                              <span className="font-medium">{log.operation}</span>
                            </div>
                            <span className="text-sm text-slate-500">
                              {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            Traités: {log.records_processed} | Créés: {log.records_created} | Échecs: {log.records_failed}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {configDialog === 'sage50' && (
              <Tabs defaultValue="connection" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="connection">Connexion</TabsTrigger>
                  <TabsTrigger value="import">Import CSV</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="connection">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
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
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-900">Sage 50 activé</span>
                          </div>
                          <Badge className="bg-green-500">Active</Badge>
                        </div>
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
                          Activer Sage 50
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="import">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label>Fichier CSV</Label>
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
                          variant="outline"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Clients
                        </Button>

                        <Button
                          onClick={() => handleCSVUpload('items')}
                          disabled={!csvFile || uploading}
                          variant="outline"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Items
                        </Button>

                        <Button
                          onClick={() => handleCSVUpload('invoices')}
                          disabled={!csvFile || uploading}
                          variant="outline"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Factures
                        </Button>
                      </div>

                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                        <FileText className="w-4 h-4 mb-2" />
                        <p className="font-semibold mb-1">Format CSV requis:</p>
                        <p>Clients: first_name, last_name, email, phone, company, address</p>
                        <p>Items: item_code, item_name, price, description</p>
                        <p>Factures: invoice_number, customer_name, date, subtotal, total</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logs">
                  <Card>
                    <CardContent className="space-y-3 pt-6 max-h-[60vh] overflow-y-auto">
                      {syncLogs.filter(log => log.integration_type === 'sage50').map(log => (
                        <div key={log.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                                {log.status}
                              </Badge>
                              <span className="font-medium">{log.operation}</span>
                            </div>
                            <span className="text-sm text-slate-500">
                              {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            Traités: {log.records_processed} | Créés: {log.records_created} | Échecs: {log.records_failed}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {configDialog === 'quickbooks' && (
              <>
                <div>
                  <label className="text-sm font-medium">Company ID (Realm ID)</label>
                  <Input
                    value={configData.credentials?.realm_id || ''}
                    onChange={(e) => setConfigData({
                      ...configData,
                      credentials: { ...configData.credentials, realm_id: e.target.value }
                    })}
                    placeholder="Enter QuickBooks Company ID"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Access Token</label>
                  <Input
                    type="password"
                    value={configData.credentials?.access_token || ''}
                    onChange={(e) => setConfigData({
                      ...configData,
                      credentials: { ...configData.credentials, access_token: e.target.value }
                    })}
                    placeholder="Enter access token"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setConfigDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate({ ...configData, status: 'active' })}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save & Activate'}
                  </Button>
                </div>
              </>
            )}

            {configDialog === 'google_calendar' && (
              <>
                <div>
                  <label className="text-sm font-medium">Calendar ID</label>
                  <Input
                    value={configData.credentials?.calendar_id || ''}
                    onChange={(e) => setConfigData({
                      ...configData,
                      credentials: { ...configData.credentials, calendar_id: e.target.value }
                    })}
                    placeholder="primary or calendar@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Access Token</label>
                  <Input
                    type="password"
                    value={configData.credentials?.access_token || ''}
                    onChange={(e) => setConfigData({
                      ...configData,
                      credentials: { ...configData.credentials, access_token: e.target.value }
                    })}
                    placeholder="OAuth access token"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setConfigDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate({ ...configData, status: 'active' })}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save & Activate'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
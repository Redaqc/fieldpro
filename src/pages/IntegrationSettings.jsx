import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, XCircle, RefreshCw, Upload, Download, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";

export default function IntegrationSettings() {
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Intégrations comptables</h1>
        <p className="text-slate-500 mt-1">Connectez Zoho Books et Sage 50 Canada</p>
      </div>

      <Tabs defaultValue="zoho" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zoho">Zoho Books</TabsTrigger>
          <TabsTrigger value="sage50">Sage 50 Canada</TabsTrigger>
          <TabsTrigger value="logs">Journal d'activité</TabsTrigger>
        </TabsList>

        {/* Zoho Books Tab */}
        <TabsContent value="zoho">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Card */}
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
                      <p><strong>Dernier sync clients:</strong> {zohoSettings.last_sync_customers ? format(new Date(zohoSettings.last_sync_customers), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
                      <p><strong>Dernier sync factures:</strong> {zohoSettings.last_sync_invoices ? format(new Date(zohoSettings.last_sync_invoices), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
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

            {/* Sync Operations */}
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

        {/* Sage 50 Canada Tab */}
        <TabsContent value="sage50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Card */}
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
                  <div className="text-sm space-y-2">
                    <p><strong>Mode:</strong> {sage50Settings.sage50_sync_mode?.toUpperCase()}</p>
                    <p><strong>Dernier sync:</strong> {sage50Settings.last_sync_customers ? format(new Date(sage50Settings.last_sync_customers), 'dd/MM/yyyy HH:mm') : 'Jamais'}</p>
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
                    <strong>Activer Sage 50</strong>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* CSV Import/Export */}
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

        {/* Activity Log Tab */}
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
    </div>
  );
}
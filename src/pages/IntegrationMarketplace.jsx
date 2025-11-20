import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Zap, Calendar, Mail, DollarSign, Webhook } from "lucide-react";

const INTEGRATIONS = [
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
  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.Integration.list(),
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

  const getIntegrationStatus = (type) => {
    const integration = integrations.find(i => i.type === type);
    return integration?.status || 'inactive';
  };

  const handleConfigure = (integrationType) => {
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {configDialog}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
              </>
            )}

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
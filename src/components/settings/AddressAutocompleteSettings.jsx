import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function AddressAutocompleteSettings() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

  const { data: addressSettings } = useQuery({
    queryKey: ['integrationSettings', 'address_autocomplete'],
    queryFn: async () => {
      const settings = await base44.entities.IntegrationSettings.filter({ integration_type: 'address_autocomplete' });
      return settings[0] || null;
    },
  });

  useEffect(() => {
    if (addressSettings?.api_key) {
      setApiKey(addressSettings.api_key);
    }
  }, [addressSettings]);

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const currentData = addressSettings || {};
      const fullData = {
        integration_type: 'address_autocomplete',
        provider_type: currentData.provider_type || 'google',
        country_bias: currentData.country_bias || 'ca',
        language: currentData.language || 'fr',
        is_active: currentData.is_active || false,
        api_key: currentData.api_key || '',
        ...updates
      };

      if (addressSettings?.id) {
        return await base44.entities.IntegrationSettings.update(addressSettings.id, fullData);
      } else {
        return await base44.entities.IntegrationSettings.create(fullData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
      alert('Paramètres sauvegardés avec succès!');
    },
    onError: (error) => {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
  });

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Enable Address Autocomplete</p>
          <p className="text-sm text-slate-500">Automatically suggest and complete addresses</p>
        </div>
        <Switch
          checked={addressSettings?.is_active || false}
          onCheckedChange={(checked) => updateMutation.mutate({ is_active: checked })}
        />
      </div>

      <div>
        <Label>Provider</Label>
        <Select
          value={addressSettings?.provider_type || 'google'}
          onValueChange={(value) => updateMutation.mutate({ provider_type: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google Places API</SelectItem>
            <SelectItem value="mapbox">Mapbox Geocoding API</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>API Key</Label>
        <Input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className="mt-1"
        />
        <p className="text-xs text-slate-500 mt-1">
          {addressSettings?.provider_type === 'mapbox' 
            ? 'Get your key from: https://account.mapbox.com/access-tokens/'
            : 'Get your key from: https://console.cloud.google.com/apis/credentials'
          }
        </p>
      </div>

      <div>
        <Label>Country Bias</Label>
        <Select
          value={addressSettings?.country_bias || 'ca'}
          onValueChange={(value) => updateMutation.mutate({ country_bias: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="fr">France</SelectItem>
            <SelectItem value="gb">United Kingdom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Language</Label>
        <Select
          value={addressSettings?.language || 'fr'}
          onValueChange={(value) => updateMutation.mutate({ language: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Address autocomplete will be available in Customer forms, Job locations, and Service Call addresses.
        </p>
      </div>

      <Button 
        onClick={() => updateMutation.mutate({ api_key: apiKey })}
        disabled={updateMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {updateMutation.isPending ? 'Saving...' : 'Save API Key'}
      </Button>
    </>
  );
}
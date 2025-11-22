import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bell, Mail, Smartphone, Save } from "lucide-react";

export default function NotificationSettings({ currentUser }) {
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences', currentUser?.email],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: currentUser?.email });
      return prefs.length > 0 ? prefs[0] : null;
    },
    enabled: !!currentUser,
  });

  const [formData, setFormData] = useState({
    email_notifications: true,
    push_notifications: true,
    job_assigned: true,
    job_status_changed: true,
    gps_alerts: true,
    time_entry_reminders: true,
    invoice_updates: true,
    quotation_updates: true,
    daily_digest: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        email_notifications: preferences.email_notifications ?? true,
        push_notifications: preferences.push_notifications ?? true,
        job_assigned: preferences.job_assigned ?? true,
        job_status_changed: preferences.job_status_changed ?? true,
        gps_alerts: preferences.gps_alerts ?? true,
        time_entry_reminders: preferences.time_entry_reminders ?? true,
        invoice_updates: preferences.invoice_updates ?? true,
        quotation_updates: preferences.quotation_updates ?? true,
        daily_digest: preferences.daily_digest ?? false,
        quiet_hours_start: preferences.quiet_hours_start || "22:00",
        quiet_hours_end: preferences.quiet_hours_end || "08:00",
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return base44.entities.NotificationPreference.update(preferences.id, data);
      } else {
        return base44.entities.NotificationPreference.create({
          ...data,
          user_id: currentUser?.id,
          user_email: currentUser?.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      alert('Préférences sauvegardées');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Canaux de notification</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-600" />
              <Label>Notifications par email</Label>
            </div>
            <Switch
              checked={formData.email_notifications}
              onCheckedChange={(checked) => handleChange('email_notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-600" />
              <Label>Notifications dans l'application</Label>
            </div>
            <Switch
              checked={formData.push_notifications}
              onCheckedChange={(checked) => handleChange('push_notifications', checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Types de notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Nouveau job assigné</Label>
              <p className="text-xs text-slate-500">Recevoir une notification quand un job vous est assigné</p>
            </div>
            <Switch
              checked={formData.job_assigned}
              onCheckedChange={(checked) => handleChange('job_assigned', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Changement de statut de job</Label>
              <p className="text-xs text-slate-500">Alertes pour les changements de statut</p>
            </div>
            <Switch
              checked={formData.job_status_changed}
              onCheckedChange={(checked) => handleChange('job_status_changed', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Alertes GPS</Label>
              <p className="text-xs text-slate-500">Notifications pour les événements de geofencing</p>
            </div>
            <Switch
              checked={formData.gps_alerts}
              onCheckedChange={(checked) => handleChange('gps_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Rappels de pointage</Label>
              <p className="text-xs text-slate-500">Rappels pour poinçonner entrée/sortie</p>
            </div>
            <Switch
              checked={formData.time_entry_reminders}
              onCheckedChange={(checked) => handleChange('time_entry_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mises à jour factures</Label>
              <p className="text-xs text-slate-500">Notifications sur les paiements et changements de factures</p>
            </div>
            <Switch
              checked={formData.invoice_updates}
              onCheckedChange={(checked) => handleChange('invoice_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mises à jour soumissions</Label>
              <p className="text-xs text-slate-500">Alertes d'acceptation ou refus de soumission</p>
            </div>
            <Switch
              checked={formData.quotation_updates}
              onCheckedChange={(checked) => handleChange('quotation_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Résumé quotidien</Label>
              <p className="text-xs text-slate-500">Recevoir un résumé de vos activités chaque jour</p>
            </div>
            <Switch
              checked={formData.daily_digest}
              onCheckedChange={(checked) => handleChange('daily_digest', checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Heures silencieuses</h3>
        <p className="text-sm text-slate-600 mb-4">
          Vous ne recevrez pas de notifications pendant ces heures (sauf urgentes)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Début</Label>
            <Input
              type="time"
              value={formData.quiet_hours_start}
              onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Fin</Label>
            <Input
              type="time"
              value={formData.quiet_hours_end}
              onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
        <Save className="w-4 h-4 mr-2" />
        Sauvegarder les préférences
      </Button>
    </div>
  );
}
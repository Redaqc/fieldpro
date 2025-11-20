import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@antml/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, MapPin, Edit, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GPSZoneManager({ zones, jobs }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    job_id: "",
    latitude: "",
    longitude: "",
    radius: 100,
    address: "",
    enable_entry_alerts: false,
    enable_exit_alerts: false,
  });
  const queryClient = useQueryClient();

  const createZoneMutation = useMutation({
    mutationFn: (data) => {
      const job = jobs.find(j => j.id === data.job_id);
      return base44.entities.GPSZone.create({
        ...data,
        job_title: job?.title || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsZones'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GPSZone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsZones'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id) => base44.entities.GPSZone.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsZones'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      job_id: "",
      latitude: "",
      longitude: "",
      radius: 100,
      address: "",
      enable_entry_alerts: false,
      enable_exit_alerts: false,
    });
    setEditingZone(null);
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      job_id: zone.job_id || "",
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      address: zone.address || "",
      enable_entry_alerts: zone.enable_entry_alerts || false,
      enable_exit_alerts: zone.enable_exit_alerts || false,
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: parseInt(formData.radius),
    };

    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          alert("Impossible d'obtenir la localisation");
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Zones GPS définies</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Zone
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map(zone => (
          <Card key={zone.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold">{zone.name}</h4>
              </div>
              <Badge variant={zone.active ? "default" : "secondary"}>
                {zone.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            {zone.job_title && (
              <p className="text-sm text-slate-600 mb-2">Job: {zone.job_title}</p>
            )}
            {zone.address && (
              <p className="text-xs text-slate-500 mb-2">{zone.address}</p>
            )}
            <div className="text-xs text-slate-500 space-y-1 mb-2">
              <p>Lat: {zone.latitude.toFixed(6)}</p>
              <p>Long: {zone.longitude.toFixed(6)}</p>
              <p>Rayon: {zone.radius}m</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {zone.enable_entry_alerts && (
                <Badge variant="outline" className="text-xs">
                  <Bell className="w-3 h-3 mr-1" />
                  Alerte entrée
                </Badge>
              )}
              {zone.enable_exit_alerts && (
                <Badge variant="outline" className="text-xs">
                  <Bell className="w-3 h-3 mr-1" />
                  Alerte sortie
                </Badge>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(zone)}
                className="flex-1"
              >
                <Edit className="w-3 h-3 mr-1" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Supprimer cette zone?')) {
                    deleteZoneMutation.mutate(zone.id);
                  }
                }}
                className="text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showDialog && (
        <Dialog open={showDialog} onOpenChange={() => { setShowDialog(false); resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingZone ? 'Modifier' : 'Ajouter'} une zone GPS</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nom de la zone *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Projet associé (optionnel)</Label>
                <Select value={formData.job_id} onValueChange={(val) => setFormData({ ...formData, job_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Aucun</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} - {job.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Adresse</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Rue Example, Ville"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude *</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Longitude *</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                Utiliser ma position actuelle
              </Button>

              <div>
                <Label>Rayon (mètres) *</Label>
                <Input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  required
                  min="10"
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Alertes Geofencing
                </h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="entry-alerts">Alertes d'entrée dans la zone</Label>
                  <Switch
                    id="entry-alerts"
                    checked={formData.enable_entry_alerts}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_entry_alerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="exit-alerts">Alertes de sortie de la zone</Label>
                  <Switch
                    id="exit-alerts"
                    checked={formData.enable_exit_alerts}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_exit_alerts: checked })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  {editingZone ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
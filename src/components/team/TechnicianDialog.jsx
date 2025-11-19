import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Package, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const specializations = [
  "plumbing", "electrical", "hvac", "carpentry", "general", 
  "appliance_repair", "landscaping", "cleaning", "painting"
];

const colors = [
  "#7FDBFF", "#0074D9", "#4D9DE0", "#2E8B9E", "#5F8A8B", "#001F3F", "#39B54A", "#7DA269", "#9ACD32", "#AACC00", "#C5CC00", "#E0BF00",
  "#D4A574", "#C4A584", "#B7794F", "#AA8800", "#FF6A00", "#A10000", "#FF8800", "#FF9500", "#FF5733", "#E74C3C", "#C82333", "#9B1B30",
  "#D946D9", "#C77DD1", "#E91E63", "#A9A9A9", "#9B59B6", "#1A237E", "#26A69A", "#2E7D32", "#00897B", "#1E88E5", "#37474F", "#616161",
  "#F9E79F", "#000000", "#4A4A4A"
];

export default function TechnicianDialog({ open, onClose, onSave, technician }) {
  const [formData, setFormData] = useState(technician || {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: [],
    hourly_rate: 0,
    status: "available",
    role: "tech",
    color: colors[Math.floor(Math.random() * colors.length)],
    notes: "",
    employee_number: "",
    address: ""
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', technician?.id],
    queryFn: () => base44.entities.Asset.list(),
    enabled: !!technician?.id,
    initialData: [],
  });

  const assignedAssets = assets.filter(asset => asset.assigned_to === technician?.id);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{technician ? 'Modifier Technicien' : 'Ajouter Nouveau Technicien'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="profile" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - User Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Détails Technicien</h3>
                  
                  <div>
                    <Label htmlFor="first_name" className="text-xs text-slate-600">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="last_name" className="text-xs text-slate-600">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-xs text-slate-600">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-xs text-slate-600">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600">Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Right Column - Roles and Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rôles et Permissions</h3>
                  
                  <div>
                    <Label htmlFor="role" className="text-xs text-slate-600">Rôle</Label>
                    <Select value={formData.role || "tech"} onValueChange={(val) => handleChange('role', val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Technicien</SelectItem>
                        <SelectItem value="supervisor">Superviseur</SelectItem>
                        <SelectItem value="manager">Gestionnaire</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="hourly_rate" className="text-xs text-slate-600">Coût de main-d'œuvre par heure</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => handleChange('hourly_rate', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                      <span className="text-slate-600">$</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600">Types de travaux</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                      {specializations.map(spec => (
                        <div key={spec} className="flex items-center space-x-2">
                          <Checkbox
                            id={spec}
                            checked={formData.specialization.includes(spec)}
                            onCheckedChange={() => toggleSpecialization(spec)}
                          />
                          <label
                            htmlFor={spec}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {spec.replace('_', ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600">Couleur calendrier</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {colors.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-300' : 'border-slate-200'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleChange('color', color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600">Fiche RH d'employé</h3>
                  
                  <div>
                    <Label className="text-xs text-slate-600">Numéro d'employé</Label>
                    <Input
                      value={formData.employee_number}
                      onChange={(e) => handleChange('employee_number', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600">Adresse</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mt-6">Gestion du temps</h3>
                    <div className="mt-2">
                      <Label className="text-xs text-slate-600">Couleur de l'employé</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {colors.slice(0, 12).map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              formData.color === color ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-300' : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleChange('color', color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Assigned Assets */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Outils et Équipements Assignés
                    </h3>
                    <div className="mt-3 border rounded-lg p-3 bg-slate-50 max-h-64 overflow-y-auto">
                      {assignedAssets.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Aucun équipement assigné</p>
                      ) : (
                        <div className="space-y-2">
                          {assignedAssets.filter(a => a.type !== 'vehicle').map(asset => (
                            <div key={asset.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                              {asset.photos && asset.photos[0] ? (
                                <img src={asset.photos[0]} alt={asset.name} className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{asset.name}</p>
                                <p className="text-xs text-slate-500">{asset.brand} {asset.model}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Véhicules Assignés
                    </h3>
                    <div className="mt-3 border rounded-lg p-3 bg-slate-50 max-h-48 overflow-y-auto">
                      {assignedAssets.filter(a => a.type === 'vehicle').length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Aucun véhicule assigné</p>
                      ) : (
                        <div className="space-y-2">
                          {assignedAssets.filter(a => a.type === 'vehicle').map(vehicle => (
                            <div key={vehicle.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                              {vehicle.photos && vehicle.photos[0] ? (
                                <img src={vehicle.photos[0]} alt={vehicle.name} className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                                  <Truck className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{vehicle.name}</p>
                                <p className="text-xs text-slate-500">{vehicle.brand} {vehicle.model}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-6">
              <div className="text-center py-8 text-slate-500">
                <p>Gestion des permissions à venir</p>
              </div>
            </TabsContent>

            <div className="flex justify-center mt-6 pt-6 border-t">
              <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-12">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
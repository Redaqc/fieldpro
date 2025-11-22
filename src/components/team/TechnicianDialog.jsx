import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, Package, Truck, Upload, X as XIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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
    address: "",
    show_employee_number: false,
    show_address: false,
    auto_color: true,
    gps_punch_outside_zone: false,
    gps_punch_workstation: false,
    track_presence: false,
    is_salesperson: false,
    can_manage_projects: false,
    is_default_supervisor: false,
    can_create_service_calls: false,
    can_adjust_punches: false,
    language: "fr",
    can_view_prices: true,
    visible_modules: ["dashboard", "jobs", "schedule", "time_tracking"]
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', technician?.id],
    queryFn: () => base44.entities.Asset.list(),
    enabled: !!technician?.id,
    initialData: [],
  });

  const { data: workTypes = [] } = useQuery({
    queryKey: ['workTypes'],
    queryFn: () => base44.entities.WorkType.list(),
    initialData: [],
  });

  const assignedAssets = assets.filter(asset => asset.assigned_to === technician?.id);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('avatar_url', file_url);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
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
                  
                  {/* Photo Upload */}
                  <div>
                    <Label className="text-xs text-slate-600">Photo de profil</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {formData.avatar_url ? (
                        <div className="relative">
                          <img 
                            src={formData.avatar_url} 
                            alt="Avatar" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleChange('avatar_url', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                          <Upload className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                          disabled={uploadingPhoto}
                        />
                        <label htmlFor="photo-upload">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingPhoto}
                            onClick={() => document.getElementById('photo-upload').click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingPhoto ? 'Téléchargement...' : 'Télécharger'}
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>

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
                    {workTypes.length === 0 ? (
                      <p className="text-xs text-slate-500 mt-2">Aucun type de travail configuré. Allez dans Settings pour en ajouter.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                        {workTypes.filter(wt => wt.active).map(workType => (
                          <div key={workType.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={workType.name}
                              checked={formData.specialization.includes(workType.name)}
                              onCheckedChange={() => toggleSpecialization(workType.name)}
                            />
                            <label
                              htmlFor={workType.name}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                            >
                              <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: workType.color || '#0074D9' }}
                              />
                              {workType.label_fr}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
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

                  {/* Working Hours Configuration */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-semibold mb-3">Heures de travail</h4>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-slate-600">Début (heure)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={formData.working_hours?.start || 8}
                            onChange={(e) => handleChange('working_hours', {
                              ...formData.working_hours,
                              start: parseInt(e.target.value)
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Fin (heure)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={formData.working_hours?.end || 17}
                            onChange={(e) => handleChange('working_hours', {
                              ...formData.working_hours,
                              end: parseInt(e.target.value)
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-slate-600 mb-2 block">Jours de travail</Label>
                        <div className="grid grid-cols-7 gap-1">
                          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => {
                            const days = formData.working_hours?.days || [1, 2, 3, 4, 5];
                            const isActive = days.includes(index);
                            return (
                              <button
                                key={index}
                                type="button"
                                className={`
                                  h-10 text-xs font-medium rounded transition-all
                                  ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }
                                `}
                                onClick={() => {
                                  const currentDays = formData.working_hours?.days || [1, 2, 3, 4, 5];
                                  const newDays = isActive
                                    ? currentDays.filter(d => d !== index)
                                    : [...currentDays, index].sort();
                                  handleChange('working_hours', {
                                    ...formData.working_hours,
                                    days: newDays
                                  });
                                }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formData.working_hours?.start || 8}:00 - {formData.working_hours?.end || 17}:00
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Fiche RH d'employé</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Numéro d'employé</p>
                          <p className="text-xs text-slate-500">Vous permet d'inscrire un numéro d'employé.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.show_employee_number ? "default" : "outline"}
                            onClick={() => handleChange('show_employee_number', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.show_employee_number ? "default" : "outline"}
                            onClick={() => handleChange('show_employee_number', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      {formData.show_employee_number && (
                        <Input
                          value={formData.employee_number}
                          onChange={(e) => handleChange('employee_number', e.target.value)}
                          placeholder="Numéro d'employé"
                          className="mb-2"
                        />
                      )}

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Adresse</p>
                          <p className="text-xs text-slate-500">Vous permet d'entrer l'adresse postale de l'employé.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.show_address ? "default" : "outline"}
                            onClick={() => handleChange('show_address', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.show_address ? "default" : "outline"}
                            onClick={() => handleChange('show_address', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      {formData.show_address && (
                        <Textarea
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          rows={2}
                          placeholder="Adresse complète"
                          className="mb-2"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Gestion du temps</h3>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium text-sm">Couleur de l'employé</p>
                        <p className="text-xs text-slate-500">Vous permet de choisir la couleur dans le calendrier pour cet employé.</p>
                      </div>
                      <Select 
                        value={formData.auto_color ? "auto" : "manual"} 
                        onValueChange={(val) => handleChange('auto_color', val === "auto")}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatique</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!formData.auto_color && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {colors.slice(0, 15).map(color => (
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
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Outils et Équipements</h3>
                    <div className="border rounded-lg p-3 bg-slate-50 max-h-48 overflow-y-auto">
                      {assignedAssets.filter(a => a.type !== 'vehicle').length === 0 ? (
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

                    <h3 className="text-lg font-semibold text-red-600 mb-4 mt-4">Véhicules Assignés</h3>
                    <div className="border rounded-lg p-3 bg-slate-50 max-h-32 overflow-y-auto">
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

                {/* Right Column - Permissions */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Droits supplémentaires</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Poinçon hors zone GPS</p>
                          <p className="text-xs text-slate-500">Option pour permettre à l'employé de poinçonner en dehors des zones GPS de projet.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.gps_punch_outside_zone ? "default" : "outline"}
                            onClick={() => handleChange('gps_punch_outside_zone', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.gps_punch_outside_zone ? "default" : "outline"}
                            onClick={() => handleChange('gps_punch_outside_zone', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      <div className="py-2 border-b">
                        <p className="font-medium text-sm">Poinçon sans GPS (poste de travail)</p>
                        <p className="text-xs text-slate-500">Vous permet de spécifier le projet par défaut de l'employé lorsqu'il est sur un poste de travail sans GPS.</p>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Présences</p>
                          <p className="text-xs text-slate-500">Vous permet de contrôler si l'employé peut voir les présences.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.track_presence ? "default" : "outline"}
                            onClick={() => handleChange('track_presence', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.track_presence ? "default" : "outline"}
                            onClick={() => handleChange('track_presence', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Est un vendeur</p>
                          <p className="text-xs text-slate-500">Lui donne le droit de créer des soumissions mais de ne voir que les siennes. Cet employé sera facturé dès qu'il se connecte dans le mois et ce, même sans poinçon.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.is_salesperson ? "default" : "outline"}
                            onClick={() => handleChange('is_salesperson', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.is_salesperson ? "default" : "outline"}
                            onClick={() => handleChange('is_salesperson', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Créer et gérer les projets</p>
                          <p className="text-xs text-slate-500">L'employé va pouvoir créer des projets et les gérer sans voir les informations financières des projets.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.can_manage_projects ? "default" : "outline"}
                            onClick={() => handleChange('can_manage_projects', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.can_manage_projects ? "default" : "outline"}
                            onClick={() => handleChange('can_manage_projects', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Superviseur par défaut</p>
                          <p className="text-xs text-slate-500">L'employé va être assigné par défaut en tant que superviseur.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.is_default_supervisor ? "default" : "outline"}
                            onClick={() => handleChange('is_default_supervisor', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.is_default_supervisor ? "default" : "outline"}
                            onClick={() => handleChange('is_default_supervisor', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Appel de service</p>
                          <p className="text-xs text-slate-500">Permet à l'employé de créer des appels de services.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.can_create_service_calls ? "default" : "outline"}
                            onClick={() => handleChange('can_create_service_calls', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.can_create_service_calls ? "default" : "outline"}
                            onClick={() => handleChange('can_create_service_calls', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">Ajustement des poinçons</p>
                          <p className="text-xs text-slate-500">Cet employé peut entrer ses heures manuellement et aussi modifier ses heures de poinçons avant la validation.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={formData.can_adjust_punches ? "default" : "outline"}
                            onClick={() => handleChange('can_adjust_punches', true)}
                            className="w-16"
                          >
                            Oui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!formData.can_adjust_punches ? "default" : "outline"}
                            onClick={() => handleChange('can_adjust_punches', false)}
                            className="w-16"
                          >
                            Non
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Options d'interface</h3>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-sm">Choix de langue</p>
                        <p className="text-xs text-slate-500">Permet de changer la langue de l'employé.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={formData.language === "en" ? "default" : "outline"}
                          onClick={() => handleChange('language', 'en')}
                        >
                          English
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={formData.language === "fr" ? "default" : "outline"}
                          onClick={() => handleChange('language', 'fr')}
                        >
                          Français
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={formData.language === "es" ? "outline" : "outline"}
                          onClick={() => handleChange('language', 'es')}
                        >
                          Español
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Visibilité des prix</h3>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium text-sm">Voir les prix</p>
                      <p className="text-xs text-slate-500">Permet à l'employé de voir les prix dans les soumissions, factures et jobs.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={formData.can_view_prices ? "default" : "outline"}
                        onClick={() => handleChange('can_view_prices', true)}
                        className="w-16"
                      >
                        Oui
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!formData.can_view_prices ? "default" : "outline"}
                        onClick={() => handleChange('can_view_prices', false)}
                        className="w-16"
                      >
                        Non
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Modules visibles</h3>
                  <p className="text-sm text-slate-600 mb-3">Sélectionnez les modules auxquels cet employé a accès</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'jobs', label: 'Jobs' },
                      { id: 'schedule', label: 'Calendrier' },
                      { id: 'customers', label: 'Clients' },
                      { id: 'team', label: 'Équipe' },
                      { id: 'time_tracking', label: 'Gestion du temps' },
                      { id: 'quotations', label: 'Soumissions' },
                      { id: 'invoices', label: 'Factures' },
                      { id: 'assets', label: 'Équipements' },
                      { id: 'price_lists', label: 'Listes de prix' },
                      { id: 'materials', label: 'Matériaux' }
                    ].map(module => (
                      <div key={module.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                        <Checkbox
                          id={module.id}
                          checked={formData.visible_modules?.includes(module.id)}
                          onCheckedChange={(checked) => {
                            const current = formData.visible_modules || [];
                            if (checked) {
                              handleChange('visible_modules', [...current, module.id]);
                            } else {
                              handleChange('visible_modules', current.filter(m => m !== module.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={module.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
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
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";

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
    color: colors[Math.floor(Math.random() * colors.length)],
    notes: ""
  });

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
                    <Label htmlFor="status" className="text-xs text-slate-600">Statut</Label>
                    <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="busy">Occupé</SelectItem>
                        <SelectItem value="off_duty">Hors service</SelectItem>
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

            <TabsContent value="advanced" className="space-y-4 mt-6">
              <div className="text-center py-8 text-slate-500">
                <p>Fonctionnalités avancées à venir</p>
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
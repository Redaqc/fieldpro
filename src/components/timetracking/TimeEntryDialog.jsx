import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

export default function TimeEntryDialog({ open, onClose, onSave, entry, technicians }) {
  const [formData, setFormData] = useState(entry || {
    technician_id: "",
    technician_name: "",
    clock_in: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    clock_out: "",
    break_minutes: 0,
    notes: "",
    status: "completed"
  });

  // Check if current technician can adjust punches
  const currentTech = technicians.find(t => t.id === formData.technician_id);
  const canAdjust = currentTech?.can_adjust_punches || false;

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculate total hours when clock_in or clock_out changes
      if ((field === 'clock_in' || field === 'clock_out' || field === 'break_minutes') && updated.clock_in && updated.clock_out) {
        const totalMinutes = differenceInMinutes(new Date(updated.clock_out), new Date(updated.clock_in));
        const totalHours = ((totalMinutes - (updated.break_minutes || 0)) / 60).toFixed(2);
        updated.total_hours = parseFloat(totalHours);
      }
      
      return updated;
    });
  };

  const handleTechnicianSelect = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    if (tech) {
      handleChange('technician_id', techId);
      handleChange('technician_name', `${tech.first_name} ${tech.last_name}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier Entrée de Temps</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Technicien *</Label>
              <Select 
                value={formData.technician_id} 
                onValueChange={handleTechnicianSelect}
                disabled={!!entry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Arrivée *</Label>
              <Input
                type="datetime-local"
                value={formData.clock_in}
                onChange={(e) => handleChange('clock_in', e.target.value)}
                required
                disabled={!canAdjust && !!entry}
              />
              {!canAdjust && !!entry && (
                <p className="text-xs text-slate-500 mt-1">Permission requise pour modifier les poinçons</p>
              )}
            </div>

            <div>
              <Label>Départ</Label>
              <Input
                type="datetime-local"
                value={formData.clock_out}
                onChange={(e) => handleChange('clock_out', e.target.value)}
                disabled={!canAdjust && !!entry}
              />
            </div>

            <div>
              <Label>Pause (minutes)</Label>
              <Input
                type="number"
                value={formData.break_minutes}
                onChange={(e) => handleChange('break_minutes', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div>
              <Label>Total Heures</Label>
              <Input
                type="number"
                value={formData.total_hours || 0}
                readOnly
                className="bg-slate-50"
                step="0.01"
              />
            </div>

            <div className="col-span-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="pending_approval">En attente d'approbation</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
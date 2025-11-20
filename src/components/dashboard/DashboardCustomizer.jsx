import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LayoutDashboard, TrendingUp, AlertCircle, Users, FileText, Clock, BarChart } from "lucide-react";

const AVAILABLE_WIDGETS = [
  { id: 'jobs_by_status', name: 'Jobs par Statut', icon: LayoutDashboard, description: 'Vue graphique des jobs par statut' },
  { id: 'monthly_revenue', name: 'Revenus Mensuels', icon: TrendingUp, description: 'Évolution des revenus sur 6 mois' },
  { id: 'overdue_jobs', name: 'Jobs en Retard', icon: AlertCircle, description: 'Liste des jobs en retard' },
  { id: 'technician_performance', name: 'Performance Techniciens', icon: BarChart, description: 'Performance des techniciens' },
  { id: 'customer_stats', name: 'Statistiques Clients', icon: Users, description: 'Statistiques sur les clients' },
  { id: 'invoice_summary', name: 'Résumé Facturation', icon: FileText, description: 'Résumé des factures' },
];

export default function DashboardCustomizer({ open, onClose, selectedWidgets, onSave }) {
  const [widgets, setWidgets] = useState(selectedWidgets || []);

  const toggleWidget = (widgetId) => {
    if (widgets.includes(widgetId)) {
      setWidgets(widgets.filter(id => id !== widgetId));
    } else {
      setWidgets([...widgets, widgetId]);
    }
  };

  const handleSave = () => {
    onSave(widgets);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personnaliser le Tableau de Bord</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label>Widgets disponibles</Label>
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_WIDGETS.map(widget => {
              const Icon = widget.icon;
              const isSelected = widgets.includes(widget.id);
              
              return (
                <div
                  key={widget.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => toggleWidget(widget.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-sm">{widget.name}</p>
                      </div>
                      <p className="text-xs text-slate-500">{widget.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Users, TrendingUp, DollarSign, LayoutDashboard, BarChart, Clock, UserCheck, UserCircle, FileText } from "lucide-react";

const AVAILABLE_WIDGETS = [
  { id: 'urgent_jobs', name: 'Jobs Urgents & En Retard', icon: AlertTriangle, description: 'Jobs prioritaires et en retard', color: 'text-red-500' },
  { id: 'tasks_by_technician', name: 'Répartition des Tâches', icon: Users, description: 'Distribution des jobs par technicien', color: 'text-blue-500' },
  { id: 'project_progress', name: 'Avancement Projets', icon: TrendingUp, description: 'Progression via jalons et tâches', color: 'text-green-500' },
  { id: 'financial_indicators', name: 'Indicateurs Financiers', icon: DollarSign, description: 'Factures, revenus et coûts', color: 'text-green-600' },
  { id: 'jobs_by_status', name: 'Jobs par Statut', icon: LayoutDashboard, description: 'Vue graphique des jobs par statut', color: 'text-purple-500' },
  { id: 'monthly_revenue', name: 'Revenus Mensuels', icon: BarChart, description: 'Évolution des revenus sur 6 mois', color: 'text-indigo-500' },
  { id: 'overdue_jobs', name: 'Jobs en Retard', icon: Clock, description: 'Liste des jobs en retard', color: 'text-orange-500' },
  { id: 'technician_performance', name: 'Performance Techniciens', icon: UserCheck, description: 'Performance des techniciens', color: 'text-teal-500' },
  { id: 'customer_stats', name: 'Statistiques Clients', icon: UserCircle, description: 'Statistiques sur les clients', color: 'text-pink-500' },
  { id: 'invoice_summary', name: 'Résumé Factures', icon: FileText, description: 'Résumé des factures', color: 'text-cyan-500' },
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Personnaliser le Tableau de Bord</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Sélectionnez les widgets à afficher sur votre tableau de bord personnalisé
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_WIDGETS.map(widget => {
              const Icon = widget.icon;
              const isSelected = widgets.includes(widget.id);
              
              return (
                <div
                  key={widget.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onClick={() => toggleWidget(widget.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-5 h-5 ${widget.color}`} />
                        <p className="font-semibold text-sm">{widget.name}</p>
                      </div>
                      <p className="text-xs text-slate-500">{widget.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mt-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              {widgets.length} widget(s) sélectionné(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {widgets.map(id => {
                const widget = AVAILABLE_WIDGETS.find(w => w.id === id);
                const Icon = widget?.icon;
                return widget ? (
                  <div key={id} className="flex items-center gap-1 px-3 py-1 bg-white border rounded-full text-xs">
                    <Icon className={`w-3 h-3 ${widget.color}`} />
                    <span>{widget.name}</span>
                  </div>
                ) : null;
              })}
            </div>
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
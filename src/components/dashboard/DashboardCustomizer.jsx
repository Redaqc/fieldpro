import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Users, TrendingUp, DollarSign, LayoutDashboard, BarChart, Clock, UserCheck, UserCircle, FileText, Activity, Briefcase, Trophy, Package, TrendingDown } from "lucide-react";

const AVAILABLE_WIDGETS = [
  { id: 'invoices_due', name: 'Factures À Recevoir', icon: FileText, description: 'Factures dues et en retard', color: 'text-orange-500' },
  { id: 'jobs_by_status_new', name: 'Jobs par Statut (Nouveau)', icon: Briefcase, description: 'Soumis, planifié, en cours, terminé', color: 'text-blue-500' },
  { id: 'recent_activities', name: 'Activités Récentes', icon: Activity, description: 'Factures, soumissions, dépenses', color: 'text-purple-500' },
  { id: 'payments_chart', name: 'Paiements Reçus', icon: DollarSign, description: 'Graphique des paiements reçus', color: 'text-green-500' },
  { id: 'top_clients', name: 'Top Clients', icon: Trophy, description: 'Clients avec plus de revenus', color: 'text-yellow-500' },
  { id: 'stock_alert', name: 'Alertes Stock', icon: Package, description: 'Matériaux en rupture ou bas', color: 'text-red-500' },
  { id: 'sales_vs_cost', name: 'Ventes vs Coûts', icon: TrendingDown, description: 'Comparaison ventes et coûts', color: 'text-indigo-500' },
  { id: 'overdue_jobs_new', name: 'Jobs en Retard (Nouveau)', icon: Clock, description: 'Jobs dépassant date limite', color: 'text-red-600' },
  { id: 'urgent_jobs', name: 'Jobs Urgents', icon: AlertTriangle, description: 'Jobs prioritaires', color: 'text-red-500' },
  { id: 'tasks_by_technician', name: 'Répartition des Tâches', icon: Users, description: 'Distribution par technicien', color: 'text-blue-500' },
  { id: 'project_progress', name: 'Avancement Projets', icon: TrendingUp, description: 'Progression via jalons', color: 'text-green-500' },
  { id: 'financial_indicators', name: 'Indicateurs Financiers', icon: DollarSign, description: 'Revenus et coûts', color: 'text-green-600' },
  { id: 'technician_performance', name: 'Performance Techniciens', icon: UserCheck, description: 'Statistiques techniciens', color: 'text-teal-500' },
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
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${
                    isSelected ? 'border-blue-500 shadow-lg' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => toggleWidget(widget.id)}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className={`w-full h-full ${widget.color.replace('text-', 'bg-')}`} />
                  </div>
                  <div className="relative flex items-start gap-3">
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded ${widget.color.replace('text-', 'bg-')} bg-opacity-20`}>
                          <Icon className={`w-5 h-5 ${widget.color}`} />
                        </div>
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
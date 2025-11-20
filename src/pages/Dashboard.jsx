import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings2, LayoutDashboard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardCustomizer from "@/components/dashboard/DashboardCustomizer";
import WidgetJobsByStatus from "@/components/dashboard/WidgetJobsByStatus";
import WidgetMonthlyRevenue from "@/components/dashboard/WidgetMonthlyRevenue";
import WidgetOverdueJobs from "@/components/dashboard/WidgetOverdueJobs";
import WidgetTechnicianPerformance from "@/components/dashboard/WidgetTechnicianPerformance";
import WidgetCustomerStats from "@/components/dashboard/WidgetCustomerStats";
import WidgetInvoiceSummary from "@/components/dashboard/WidgetInvoiceSummary";
import WidgetUrgentJobs from "@/components/dashboard/WidgetUrgentJobs";
import WidgetTasksByTechnician from "@/components/dashboard/WidgetTasksByTechnician";
import WidgetProjectProgress from "@/components/dashboard/WidgetProjectProgress";
import WidgetFinancialIndicators from "@/components/dashboard/WidgetFinancialIndicators";
import AlertsPanel from "@/components/shared/AlertsPanel";
import WidgetAlerts from "@/components/dashboard/WidgetAlerts";
import InvoicesDueWidget from "@/components/dashboard/InvoicesDueWidget";
import JobsByStatusWidget from "@/components/dashboard/JobsByStatusWidget";
import RecentActivitiesWidget from "@/components/dashboard/RecentActivitiesWidget";
import PaymentsChartWidget from "@/components/dashboard/PaymentsChartWidget";
import TopClientsWidget from "@/components/dashboard/TopClientsWidget";
import StockAlertWidget from "@/components/dashboard/StockAlertWidget";
import SalesVsCostWidget from "@/components/dashboard/SalesVsCostWidget";
import OverdueJobsWidget from "@/components/dashboard/OverdueJobsWidget";

const DEFAULT_VIEWS = {
  admin: ['invoices_due', 'jobs_by_status_new', 'recent_activities', 'payments_chart', 'top_clients', 'stock_alert', 'sales_vs_cost', 'overdue_jobs_new', 'financial_indicators', 'tasks_by_technician', 'technician_performance'],
  manager: ['invoices_due', 'jobs_by_status_new', 'overdue_jobs_new', 'sales_vs_cost', 'tasks_by_technician', 'payments_chart', 'stock_alert'],
  technician: ['tasks_by_technician', 'jobs_by_status_new', 'overdue_jobs_new', 'recent_activities'],
};

export default function Dashboard() {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('admin');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    initialData: [],
  });

  const { data: supplierInvoices = [] } = useQuery({
    queryKey: ['supplierInvoices'],
    queryFn: () => base44.entities.SupplierInvoice.list(),
    initialData: [],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
    initialData: [],
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => base44.entities.Quotation.list(),
    initialData: [],
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
    initialData: [],
  });

  const { data: dashboardConfigs = [] } = useQuery({
    queryKey: ['dashboardConfigs', currentUser?.email],
    queryFn: () => base44.entities.DashboardConfig.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
    initialData: [],
  });

  const userConfig = dashboardConfigs.find(c => c.is_default) || dashboardConfigs[0];

  const saveDashboardMutation = useMutation({
    mutationFn: (widgets) => {
      if (userConfig) {
        return base44.entities.DashboardConfig.update(userConfig.id, {
          layout: widgets.map((w, idx) => ({
            id: `widget_${idx}`,
            type: w,
            position: { x: 0, y: 0, w: 1, h: 1 }
          }))
        });
      } else {
        return base44.entities.DashboardConfig.create({
          user_id: currentUser?.id,
          user_email: currentUser?.email,
          name: 'Mon tableau de bord',
          is_default: true,
          layout: widgets.map((w, idx) => ({
            id: `widget_${idx}`,
            type: w,
            position: { x: 0, y: 0, w: 1, h: 1 }
          }))
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardConfigs'] });
    },
  });

  const currentTech = technicians.find(t => t.email === currentUser?.email);
  const userRole = currentUser?.role === 'admin' ? 'admin' : (currentTech?.role || 'technician');

  const getActiveWidgets = () => {
    if (selectedView === 'custom') {
      if (userConfig?.layout && userConfig.layout.length > 0) {
        return userConfig.layout.map(w => w.type);
      }
      // Si pas de config, utiliser la vue admin par défaut
      return DEFAULT_VIEWS.admin;
    }
    return DEFAULT_VIEWS[selectedView] || DEFAULT_VIEWS[userRole];
  };

  const activeWidgets = getActiveWidgets();

  const renderWidget = (widgetType) => {
    switch (widgetType) {
      case 'invoices_due':
        return <InvoicesDueWidget key={widgetType} invoices={invoices} />;
      case 'jobs_by_status_new':
        return <JobsByStatusWidget key={widgetType} jobs={jobs} />;
      case 'recent_activities':
        return <RecentActivitiesWidget key={widgetType} invoices={invoices} quotations={quotations} expenses={supplierInvoices} />;
      case 'payments_chart':
        return <PaymentsChartWidget key={widgetType} payments={payments} />;
      case 'top_clients':
        return <TopClientsWidget key={widgetType} customers={customers} invoices={invoices} />;
      case 'stock_alert':
        return <StockAlertWidget key={widgetType} materials={materials} />;
      case 'sales_vs_cost':
        return <SalesVsCostWidget key={widgetType} invoices={invoices} jobs={jobs} />;
      case 'overdue_jobs_new':
        return <OverdueJobsWidget key={widgetType} jobs={jobs} />;
      case 'alerts':
        return <WidgetAlerts key={widgetType} />;
      case 'urgent_jobs':
        return <WidgetUrgentJobs key={widgetType} jobs={jobs} />;
      case 'tasks_by_technician':
        return <WidgetTasksByTechnician key={widgetType} jobs={jobs} technicians={technicians} />;
      case 'project_progress':
        return <WidgetProjectProgress key={widgetType} jobs={jobs} />;
      case 'financial_indicators':
        return <WidgetFinancialIndicators key={widgetType} jobs={jobs} invoices={invoices} />;
      case 'jobs_by_status':
        return <WidgetJobsByStatus key={widgetType} jobs={jobs} />;
      case 'monthly_revenue':
        return <WidgetMonthlyRevenue key={widgetType} invoices={invoices} />;
      case 'overdue_jobs':
        return <WidgetOverdueJobs key={widgetType} jobs={jobs} />;
      case 'technician_performance':
        return <WidgetTechnicianPerformance key={widgetType} jobs={jobs} technicians={technicians} />;
      case 'customer_stats':
        return <WidgetCustomerStats key={widgetType} customers={customers} jobs={jobs} invoices={invoices} />;
      case 'invoice_summary':
        return <WidgetInvoiceSummary key={widgetType} invoices={invoices} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            Tableau de Bord
          </h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble personnalisée</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Vue personnalisée</SelectItem>
              <SelectItem value="admin">Vue Admin</SelectItem>
              <SelectItem value="manager">Vue Manager</SelectItem>
              <SelectItem value="technician">Vue Technicien</SelectItem>
            </SelectContent>
          </Select>

          {selectedView === 'custom' && (
            <Button onClick={() => setCustomizerOpen(true)} variant="outline">
              <Settings2 className="w-4 h-4 mr-2" />
              Personnaliser
            </Button>
          )}
        </div>
      </div>

      <AlertsPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {activeWidgets.map(widgetType => renderWidget(widgetType))}
      </div>

      {activeWidgets.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun widget sélectionné</h3>
          <p className="text-slate-500 mb-4">Cliquez sur "Personnaliser" pour ajouter des widgets</p>
          <Button onClick={() => setCustomizerOpen(true)}>
            <Settings2 className="w-4 h-4 mr-2" />
            Personnaliser le tableau de bord
          </Button>
        </div>
      )}

      <DashboardCustomizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        selectedWidgets={activeWidgets}
        onSave={(widgets) => saveDashboardMutation.mutate(widgets)}
      />
    </div>
  );
}
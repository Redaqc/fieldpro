import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, LayoutDashboard, DollarSign, ShoppingCart, Wallet, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
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
import MetricCard from "@/components/dashboard/MetricCard";

const DEFAULT_VIEWS = {
  admin: ['alerts', 'urgent_jobs', 'financial_indicators', 'project_progress', 'tasks_by_technician', 'jobs_by_status', 'monthly_revenue', 'technician_performance', 'invoice_summary'],
  manager: ['alerts', 'urgent_jobs', 'project_progress', 'tasks_by_technician', 'jobs_by_status', 'financial_indicators', 'technician_performance'],
  technician: ['urgent_jobs', 'tasks_by_technician', 'jobs_by_status', 'project_progress'],
};

export default function Dashboard() {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('custom');
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
    if (selectedView === 'custom' && userConfig?.layout) {
      return userConfig.layout.map(w => w.type);
    }
    return DEFAULT_VIEWS[selectedView] || DEFAULT_VIEWS[userRole];
  };

  const activeWidgets = getActiveWidgets();

  // Calculate key metrics
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPurchases = supplierInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const clientPayments = invoices.filter(i => i.status === 'paid').length;
  const supplierPayments = supplierInvoices.filter(i => i.status === 'paid').length;
  const totalExpenses = supplierInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const balanceTransfers = jobs.filter(j => j.status === 'completed').length;

  const renderWidget = (widgetType) => {
    switch (widgetType) {
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <Badge variant="outline" className="text-xs">Today</Badge>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-48 h-9 border-slate-200">
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
              <Button onClick={() => setCustomizerOpen(true)} variant="outline" size="sm" className="h-9">
                <Settings2 className="w-4 h-4 mr-2" />
                Customize
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Today Summary */}
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Today Summary</h2>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Purchase"
            value={`$${totalRevenue.toFixed(2)}`}
            subtitle="Revenue"
            icon={ShoppingCart}
            gradient="from-blue-400 to-blue-600"
          />
          <MetricCard
            title="Purchase Return"
            value={`$${(invoices.filter(i => i.status === 'cancelled').reduce((s, i) => s + (i.total || 0), 0)).toFixed(2)}`}
            subtitle="Returns"
            icon={TrendingDown}
            gradient="from-cyan-400 to-cyan-600"
          />
          <MetricCard
            title="Sales"
            value={`$${(jobs.filter(j => j.status === 'completed' && j.invoice_total).reduce((s, j) => s + (j.invoice_total || 0), 0)).toFixed(2)}`}
            subtitle="Completed Jobs"
            icon={TrendingUp}
            gradient="from-purple-400 to-purple-600"
          />
          <MetricCard
            title="Sales Return"
            value={`$${(jobs.filter(j => j.status === 'cancelled').length * 100).toFixed(2)}`}
            subtitle="Cancelled"
            icon={TrendingDown}
            gradient="from-slate-400 to-slate-600"
          />
          <MetricCard
            title="Client Payment"
            value={`$${(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)).toFixed(2)}`}
            subtitle={`${clientPayments} Payments`}
            icon={Wallet}
            gradient="from-green-400 to-green-600"
          />
          <MetricCard
            title="Supplier Payment"
            value={`$${totalPurchases.toFixed(2)}`}
            subtitle={`${supplierPayments} Payments`}
            icon={CreditCard}
            gradient="from-purple-500 to-purple-700"
          />
          <MetricCard
            title="Expense"
            value={`$${totalExpenses.toFixed(2)}`}
            subtitle="Total Expenses"
            icon={DollarSign}
            gradient="from-red-400 to-red-600"
          />
          <MetricCard
            title="Balance Transfers"
            value={`$${(balanceTransfers * 1000).toFixed(2)}`}
            subtitle={`${balanceTransfers} Transfers`}
            icon={TrendingUp}
            gradient="from-slate-700 to-slate-900"
          />
        </div>

        <AlertsPanel />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeWidgets.map(widgetType => renderWidget(widgetType))}
        </div>

        {activeWidgets.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg bg-white">
            <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun widget sélectionné</h3>
            <p className="text-slate-500 mb-4">Cliquez sur "Customize" pour ajouter des widgets</p>
            <Button onClick={() => setCustomizerOpen(true)}>
              <Settings2 className="w-4 h-4 mr-2" />
              Personnaliser
            </Button>
          </div>
        )}
      </div>

      <DashboardCustomizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        selectedWidgets={activeWidgets}
        onSave={(widgets) => saveDashboardMutation.mutate(widgets)}
      />
      </div>
    </div>
  );
}
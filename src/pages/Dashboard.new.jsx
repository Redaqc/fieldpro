import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tantml:react-query";
import { useTranslation } from "@/components/shared/translations";
import { Button } from "@/components/ui/button";
import { Settings2, LayoutDashboard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// NEW: Import our custom hooks
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useJobs } from "@/hooks/useJobs";
import { useCustomers } from "@/hooks/useCustomers";
import { useInvoices } from "@/hooks/useInvoices";
import { useSupplierInvoicess } from "@/hooks/useSupplierInvoicess";
import { usePaymentss } from "@/hooks/usePaymentss";
import { useQuotationss } from "@/hooks/useQuotationss";
import { useMaterialss } from "@/hooks/useMaterialss";
import { useDashboardConfigs, useCreateDashboardConfigs, useUpdateDashboardConfigs } from "@/hooks/useDashboardConfigs";
import { useLanguageSettingss } from "@/hooks/useLanguageSettingss";

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
import TodaySummaryWidget from "@/components/dashboard/TodaySummaryWidget";

const DEFAULT_VIEWS = {
  admin: ['today_summary', 'invoices_due', 'jobs_by_status_new', 'recent_activities', 'payments_chart', 'top_clients', 'stock_alert', 'sales_vs_cost', 'overdue_jobs_new', 'financial_indicators', 'tasks_by_technician', 'technician_performance'],
  manager: ['today_summary', 'invoices_due', 'jobs_by_status_new', 'overdue_jobs_new', 'sales_vs_cost', 'tasks_by_technician', 'payments_chart', 'stock_alert'],
  technician: ['tasks_by_technician', 'jobs_by_status_new', 'overdue_jobs_new', 'recent_activities'],
};

export default function Dashboard() {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('custom');
  const queryClient = useQueryClient();

  // NEW: Use our custom hooks
  const { user: currentUser } = useAuth();

  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000 });
  const technicians = techniciansData?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const { data: invoicesData } = useInvoices({ page: 1, limit: 1000 });
  const invoices = invoicesData?.data || [];

  const { data: supplierInvoicesData } = useSupplierInvoicess({ page: 1, limit: 1000 });
  const supplierInvoices = supplierInvoicesData?.data || [];

  const { data: paymentsData } = usePaymentss({ page: 1, limit: 1000 });
  const payments = paymentsData?.data || [];

  const { data: quotationsData } = useQuotationss({ page: 1, limit: 1000 });
  const quotations = quotationsData?.data || [];

  const { data: materialsData } = useMaterialss({ page: 1, limit: 1000 });
  const materials = materialsData?.data || [];

  // Dashboard configs filtered by user email
  const { data: dashboardConfigsData } = useDashboardConfigs({
    page: 1,
    limit: 100,
    userEmail: currentUser?.email
  });
  const dashboardConfigs = dashboardConfigsData?.data || [];

  const { data: languageSettingsData } = useLanguageSettingss({ page: 1, limit: 1 });
  const languageSettings = languageSettingsData?.data?.[0] || { language: 'fr' };

  const lang = languageSettings?.language || 'fr';
  const t = useTranslation(lang);

  const userConfig = dashboardConfigs.find(c => c.isDefault) || dashboardConfigs[0];

  const createDashboardMutation = useCreateDashboardConfigs();
  const updateDashboardMutation = useUpdateDashboardConfigs();

  const saveDashboardMutation = useMutation({
    mutationFn: (widgets) => {
      const layoutData = {
        layout: widgets.map((w, idx) => ({
          id: `widget_${idx}`,
          type: w,
          position: { x: 0, y: 0, w: 1, h: 1 }
        }))
      };

      if (userConfig) {
        return updateDashboardMutation.mutateAsync({
          id: userConfig.id,
          data: layoutData
        });
      } else {
        return createDashboardMutation.mutateAsync({
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          name: t('dashboard'),
          isDefault: true,
          ...layoutData
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardConfigs'] });
    },
  });

  // Transform data to match component expectations (snake_case)
  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    user_id: tech.userId,
    is_active: tech.isActive,
    phone_number: tech.phoneNumber,
    first_name: tech.name?.split(' ')[0] || tech.name || '',
    last_name: tech.name?.split(' ').slice(1).join(' ') || '',
  }));

  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    work_type_id: job.workTypeId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
    created_date: job.createdAt,
  }));

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    first_name: customer.fullName?.split(' ')[0] || '',
    last_name: customer.fullName?.split(' ').slice(1).join(' ') || '',
    company_name: customer.companyName,
    is_active: customer.isActive,
  }));

  const transformedInvoices = invoices.map(invoice => ({
    ...invoice,
    invoice_number: invoice.invoiceNumber,
    customer_id: invoice.customerId,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    tax_amount: invoice.taxAmount,
  }));

  const transformedSupplierInvoices = supplierInvoices.map(inv => ({
    ...inv,
    invoice_number: inv.invoiceNumber,
    supplier_id: inv.supplierId,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
  }));

  const transformedPayments = payments.map(payment => ({
    ...payment,
    invoice_id: payment.invoiceId,
    payment_date: payment.paymentDate,
    payment_method: payment.paymentMethod,
  }));

  const transformedQuotations = quotations.map(quote => ({
    ...quote,
    quote_number: quote.quoteNumber,
    customer_id: quote.customerId,
    issue_date: quote.issueDate,
    expiry_date: quote.expiryDate,
  }));

  const transformedMaterials = materials.map(material => ({
    ...material,
    unit_price: material.unitPrice,
    min_stock: material.minStock,
  }));

  const currentTech = transformedTechnicians.find(t => t.email === currentUser?.email);
  const userRole = currentUser?.role === 'admin' ? 'admin' : (currentTech?.role || 'technician');

  const getActiveWidgets = () => {
    if (selectedView === 'custom') {
      if (userConfig?.layout && userConfig.layout.length > 0) {
        return userConfig.layout.map(w => w.type);
      }
      return DEFAULT_VIEWS.admin;
    }
    return DEFAULT_VIEWS[selectedView] || DEFAULT_VIEWS[userRole];
  };

  const activeWidgets = getActiveWidgets();

  const renderWidget = (widgetType) => {
    switch (widgetType) {
      case 'today_summary':
        return <TodaySummaryWidget key={widgetType} invoices={transformedInvoices} payments={transformedPayments} jobs={transformedJobs} expenses={transformedSupplierInvoices} lang={lang} />;
      case 'invoices_due':
        return <InvoicesDueWidget key={widgetType} invoices={transformedInvoices} lang={lang} />;
      case 'jobs_by_status_new':
        return <JobsByStatusWidget key={widgetType} jobs={transformedJobs} lang={lang} />;
      case 'recent_activities':
        return <RecentActivitiesWidget key={widgetType} invoices={transformedInvoices} quotations={transformedQuotations} expenses={transformedSupplierInvoices} lang={lang} />;
      case 'payments_chart':
        return <PaymentsChartWidget key={widgetType} payments={transformedPayments} lang={lang} />;
      case 'top_clients':
        return <TopClientsWidget key={widgetType} customers={transformedCustomers} invoices={transformedInvoices} lang={lang} />;
      case 'stock_alert':
        return <StockAlertWidget key={widgetType} materials={transformedMaterials} lang={lang} />;
      case 'sales_vs_cost':
        return <SalesVsCostWidget key={widgetType} invoices={transformedInvoices} jobs={transformedJobs} lang={lang} />;
      case 'overdue_jobs_new':
        return <OverdueJobsWidget key={widgetType} jobs={transformedJobs} lang={lang} />;
      case 'alerts':
        return <WidgetAlerts key={widgetType} lang={lang} />;
      case 'urgent_jobs':
        return <WidgetUrgentJobs key={widgetType} jobs={transformedJobs} lang={lang} />;
      case 'tasks_by_technician':
        return <WidgetTasksByTechnician key={widgetType} jobs={transformedJobs} technicians={transformedTechnicians} lang={lang} />;
      case 'project_progress':
        return <WidgetProjectProgress key={widgetType} jobs={transformedJobs} lang={lang} />;
      case 'financial_indicators':
        return <WidgetFinancialIndicators key={widgetType} jobs={transformedJobs} invoices={transformedInvoices} lang={lang} />;
      case 'jobs_by_status':
        return <WidgetJobsByStatus key={widgetType} jobs={transformedJobs} lang={lang} />;
      case 'monthly_revenue':
        return <WidgetMonthlyRevenue key={widgetType} invoices={transformedInvoices} lang={lang} />;
      case 'overdue_jobs':
        return <WidgetOverdueJobs key={widgetType} jobs={transformedJobs} lang={lang} />;
      case 'technician_performance':
        return <WidgetTechnicianPerformance key={widgetType} jobs={transformedJobs} technicians={transformedTechnicians} lang={lang} />;
      case 'customer_stats':
        return <WidgetCustomerStats key={widgetType} customers={transformedCustomers} jobs={transformedJobs} invoices={transformedInvoices} lang={lang} />;
      case 'invoice_summary':
        return <WidgetInvoiceSummary key={widgetType} invoices={transformedInvoices} lang={lang} />;
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
            {t('dashboard')}
          </h1>
          <p className="text-slate-500 mt-1">
            {lang === 'fr' ? 'Vue d\'ensemble personnalisée' : 'Custom overview'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">
                {lang === 'fr' ? 'Vue personnalisée' : 'Custom View'}
              </SelectItem>
              <SelectItem value="admin">
                {lang === 'fr' ? 'Vue Admin' : 'Admin View'}
              </SelectItem>
              <SelectItem value="manager">
                {lang === 'fr' ? 'Vue Manager' : 'Manager View'}
              </SelectItem>
              <SelectItem value="technician">
                {lang === 'fr' ? 'Vue Technicien' : 'Technician View'}
              </SelectItem>
            </SelectContent>
          </Select>

          {selectedView === 'custom' && (
            <Button onClick={() => setCustomizerOpen(true)} variant="outline">
              <Settings2 className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Personnaliser' : 'Customize'}
            </Button>
          )}
        </div>
      </div>

      <AlertsPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min bg-slate-50 -mx-6 -mb-6 p-6">
        {activeWidgets.map(widgetType => renderWidget(widgetType))}
      </div>

      {activeWidgets.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            {lang === 'fr' ? 'Aucun widget sélectionné' : 'No widget selected'}
          </h3>
          <p className="text-slate-500 mb-4">
            {lang === 'fr' ? 'Cliquez sur "Personnaliser" pour ajouter des widgets' : 'Click "Customize" to add widgets'}
          </p>
          <Button onClick={() => setCustomizerOpen(true)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {lang === 'fr' ? 'Personnaliser le tableau de bord' : 'Customize dashboard'}
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

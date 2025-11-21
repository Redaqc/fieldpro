import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Export full application package
    const fullExport = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      version: '1.0',
      database: {},
      entities: {},
      functions: {},
      pages: {},
      components: {},
      metadata: {
        app_name: 'FieldPro FSM',
        description: 'Complete field service management application export',
        platform: 'Base44',
        export_type: 'full_application'
      }
    };

    // Export all database records
    const entities = [
      'Customer', 'Technician', 'Job', 'ServiceCall', 'Invoice', 'Quotation',
      'Material', 'Asset', 'TimeEntry', 'PriceList', 'Bundle', 'WorkType',
      'GPSZone', 'GPSTracking', 'GPSAlert', 'Notification', 'Document',
      'FormTemplate', 'FormSubmission', 'FormAutomation', 'ChecklistTemplate',
      'CompanyInfo', 'TaxSettings', 'LanguageSettings', 'AppSettings',
      'Role', 'RecurringJob', 'Automation', 'DashboardConfig', 'SupplierInvoice',
      'Payment', 'MaintenanceSchedule', 'Alert', 'TeamMessage', 'Integration',
      'CustomField', 'Webhook', 'BrandingSettings', 'NotificationPreference',
      'NotificationTemplate', 'CustomerFeedback', 'IntegrationSettings', 'SyncLog',
      'ProfitabilityRecord'
    ];

    for (const entityName of entities) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list();
        fullExport.database[entityName] = records;
        
        // Also get entity schema
        try {
          const schema = await base44.asServiceRole.entities[entityName].schema();
          fullExport.entities[entityName] = schema;
        } catch (e) {
          console.log(`[exportFullApp] Could not get schema for ${entityName}`);
        }
      } catch (error) {
        console.log(`[exportFullApp] Could not export ${entityName}:`, error.message);
        fullExport.database[entityName] = [];
      }
    }

    // List available backend functions
    const availableFunctions = [
      'exportDatabase', 'exportFullApp', 'addressAutocomplete', 'addressDetails',
      'zohoAuth', 'zohoSyncCustomers', 'zohoSyncInvoices', 'zohoCreateInvoice',
      'sage50Sync', 'csvExport', 'csvImport', 'syncScheduler', 'automatedNotifications',
      'sendNotification', 'aiScheduleOptimizer', 'autoCompleteJob', 'gpsAutoTimeTracking',
      'calculateProfitability', 'automationEngine', 'smartInventoryTracking', 'routeOptimizer',
      'predictMaintenance', 'sendEmail', 'sendSMS', 'stripePayment', 'stripeWebhook',
      'quickbooksSync', 'googleCalendarSync', 'webhookDispatcher', 'sendSecurityNotification',
      'executeFormAutomations'
    ];
    
    fullExport.functions = {
      available: availableFunctions,
      count: availableFunctions.length,
      note: 'Function source code is stored in Base44 backend and can be accessed via dashboard'
    };

    // List frontend structure
    fullExport.pages = {
      available: [
        'Dashboard', 'Jobs', 'ServiceCalls', 'Customers', 'Team', 'Schedule', 'Calendar',
        'TimeTracking', 'Invoices', 'Quotations', 'Assets', 'Materials', 'PriceLists',
        'GPSTracking', 'Documents', 'Forms', 'Reports', 'Settings', 'DispatcherDashboard',
        'ManagerDashboard', 'TechnicianMobile', 'RoleManager', 'FormAutomations',
        'RecurringJobs', 'AutomationRules', 'CustomerPortal', 'AdvancedReports',
        'MaintenanceTracker', 'TeamChat', 'NotificationCenter', 'BIDashboard',
        'IntegrationMarketplace', 'CustomFields', 'WebhookManager', 'ProfitabilityReports',
        'CostsManagement', 'ScheduleAnalytics', 'WorkflowOverview'
      ],
      note: 'Page source code is stored in Base44 frontend and can be accessed via dashboard'
    };

    fullExport.components = {
      note: 'Component source code is stored in Base44 frontend and can be accessed via dashboard',
      categories: [
        'dashboard', 'jobs', 'customers', 'team', 'schedule', 'invoices', 'quotations',
        'timetracking', 'mobile', 'notifications', 'gps', 'forms', 'documents',
        'settings', 'shared', 'assets', 'materials', 'pricelists'
      ]
    };

    // Return complete export as JSON
    return Response.json(fullExport, {
      headers: {
        'Content-Disposition': `attachment; filename="fieldpro_full_export_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('[exportFullApp] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
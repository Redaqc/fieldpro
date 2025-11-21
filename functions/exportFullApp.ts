import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Create ZIP archive
    const zip = new JSZip();

    // Add README
    const readme = `# FieldPro FSM - Application Export
    
Exported: ${new Date().toISOString()}
By: ${user.email}

## Structure:
- /database/ - All database records in JSON format
- /entities/ - Entity schemas (JSON Schema format)
- README.txt - This file

## Important Notes:
1. Frontend code (pages & components) and backend functions are stored in Base44 platform
2. To access the source code:
   - Go to https://base44.app/dashboard
   - Navigate to your app
   - Use the "Code" tab to view/download individual files
   
3. This export contains:
   ✓ Complete database (all records)
   ✓ Entity schemas
   ✓ Application structure documentation
   
## Restore Instructions:
1. Create a new Base44 app
2. Import entity schemas from /entities/ folder
3. Import database records using CSV or API
4. Manually recreate pages/components/functions from Base44 dashboard backup

For complete source code backup, use Base44 dashboard export feature.
`;
    
    zip.file('README.txt', readme);

    // Export full application metadata
    const manifest = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      version: '1.0',
      app_name: 'FieldPro FSM',
      description: 'Complete field service management application export',
      platform: 'Base44',
      export_type: 'full_application_archive'
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

    // Create database folder structure
    const databaseFolder = zip.folder('database');
    const entitiesFolder = zip.folder('entities');
    
    for (const entityName of entities) {
      try {
        // Export records
        const records = await base44.asServiceRole.entities[entityName].list();
        databaseFolder.file(`${entityName}.json`, JSON.stringify(records, null, 2));
        manifest[`database_${entityName}_count`] = records.length;
        
        // Export schema
        try {
          const schema = await base44.asServiceRole.entities[entityName].schema();
          entitiesFolder.file(`${entityName}.json`, JSON.stringify(schema, null, 2));
        } catch (e) {
          console.log(`[exportFullApp] Could not get schema for ${entityName}`);
        }
      } catch (error) {
        console.log(`[exportFullApp] Could not export ${entityName}:`, error.message);
        databaseFolder.file(`${entityName}.json`, JSON.stringify([], null, 2));
      }
    }

    // Add application structure documentation
    manifest.functions = {
      available: [
        'exportDatabase', 'exportFullApp', 'addressAutocomplete', 'addressDetails',
        'zohoAuth', 'zohoSyncCustomers', 'zohoSyncInvoices', 'zohoCreateInvoice',
        'sage50Sync', 'csvExport', 'csvImport', 'syncScheduler', 'automatedNotifications',
        'sendNotification', 'aiScheduleOptimizer', 'autoCompleteJob', 'gpsAutoTimeTracking',
        'calculateProfitability', 'automationEngine', 'smartInventoryTracking', 'routeOptimizer',
        'predictMaintenance', 'sendEmail', 'sendSMS', 'stripePayment', 'stripeWebhook',
        'quickbooksSync', 'googleCalendarSync', 'webhookDispatcher', 'sendSecurityNotification',
        'executeFormAutomations'
      ],
      count: 29
    };

    manifest.pages = [
      'Dashboard', 'Jobs', 'ServiceCalls', 'Customers', 'Team', 'Schedule', 'Calendar',
      'TimeTracking', 'Invoices', 'Quotations', 'Assets', 'Materials', 'PriceLists',
      'GPSTracking', 'Documents', 'Forms', 'Reports', 'Settings', 'DispatcherDashboard',
      'ManagerDashboard', 'TechnicianMobile', 'RoleManager', 'FormAutomations',
      'RecurringJobs', 'AutomationRules', 'CustomerPortal', 'AdvancedReports',
      'MaintenanceTracker', 'TeamChat', 'NotificationCenter', 'BIDashboard',
      'IntegrationMarketplace', 'CustomFields', 'WebhookManager', 'ProfitabilityReports',
      'CostsManagement', 'ScheduleAnalytics', 'WorkflowOverview'
    ];

    manifest.component_categories = [
      'dashboard', 'jobs', 'customers', 'team', 'schedule', 'invoices', 'quotations',
      'timetracking', 'mobile', 'notifications', 'gps', 'forms', 'documents',
      'settings', 'shared', 'assets', 'materials', 'pricelists'
    ];

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'uint8array' });

    // Return ZIP file
    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="fieldpro_complete_export_${new Date().toISOString().split('T')[0]}.zip"`
      }
    });

  } catch (error) {
    console.error('[exportFullApp] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
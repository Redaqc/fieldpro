import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Database Setup and Initialization Script
 *
 * This function ensures all required entities exist in the Base44 database.
 * It should be run once during initial deployment or after major updates.
 *
 * CRITICAL ENTITIES (Must be created manually or auto-created on first use):
 * - PushSubscription: For web push notifications
 * - BrandingSettings: For application branding (optional)
 *
 * @returns {Object} Setup status and any errors encountered
 */
export default async function setupDatabase({ request }) {
  const base44 = createClientFromRequest(request);

  try {
    const setupResults = {
      success: true,
      entities_checked: [],
      entities_created: [],
      entities_verified: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    // Check if user has admin privileges
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only admin users can run database setup',
        user_role: user?.role
      };
    }

    // List of critical entities that should exist
    const criticalEntities = [
      { name: 'PushSubscription', priority: 'critical', description: 'Web push notification subscriptions' },
      { name: 'BrandingSettings', priority: 'optional', description: 'Application branding configuration' }
    ];

    // List of core entities (these usually auto-create)
    const coreEntities = [
      'Alert', 'AppSettings', 'Asset', 'Automation', 'Bundle',
      'ChecklistTemplate', 'CompanyInfo', 'CustomField', 'Customer',
      'CustomerFeedback', 'DashboardConfig', 'Document', 'FormAutomation',
      'FormSubmission', 'FormTemplate', 'GPSAlert', 'GPSTracking',
      'GPSZone', 'Integration', 'IntegrationSettings', 'Invoice', 'Job',
      'LanguageSettings', 'MaintenanceSchedule', 'Material', 'Notification',
      'NotificationPreference', 'NotificationTemplate', 'Payment',
      'PriceList', 'ProfitabilityRecord', 'Quotation', 'RecurringJob',
      'Role', 'ServiceCall', 'SupplierInvoice', 'SyncLog', 'TaxSettings',
      'TeamMessage', 'Technician', 'TimeEntry', 'Webhook', 'WorkType'
    ];

    // Check critical entities
    for (const entity of criticalEntities) {
      setupResults.entities_checked.push(entity.name);

      try {
        // Try to list the entity (this will fail if it doesn't exist)
        await base44.asServiceRole.entities[entity.name].list();
        setupResults.entities_verified.push({
          name: entity.name,
          status: 'exists',
          priority: entity.priority
        });
      } catch (error) {
        if (entity.priority === 'critical') {
          setupResults.errors.push({
            entity: entity.name,
            priority: 'critical',
            error: 'Entity does not exist',
            message: `CRITICAL: ${entity.name} entity must be created in Base44 dashboard`,
            description: entity.description,
            action_required: 'Create entity manually in Base44 Dashboard → Entities'
          });
        } else {
          setupResults.entities_verified.push({
            name: entity.name,
            status: 'missing',
            priority: entity.priority,
            message: 'Optional entity - can be created if needed'
          });
        }
      }
    }

    // Verify core entities (sample check)
    let coreEntitiesExist = 0;
    const sampleEntities = ['Customer', 'Job', 'Technician', 'Invoice', 'Asset'];

    for (const entityName of sampleEntities) {
      try {
        await base44.asServiceRole.entities[entityName].list();
        coreEntitiesExist++;
      } catch (error) {
        setupResults.errors.push({
          entity: entityName,
          priority: 'high',
          error: 'Core entity missing',
          message: `Core entity ${entityName} should auto-create on first use`
        });
      }
    }

    setupResults.core_entities_status = {
      checked: sampleEntities.length,
      verified: coreEntitiesExist,
      percentage: Math.round((coreEntitiesExist / sampleEntities.length) * 100)
    };

    // Create sample data for critical entities if they exist but are empty
    try {
      // Check if AppSettings exists and has at least one record
      const appSettings = await base44.asServiceRole.entities.AppSettings.list();
      if (appSettings.length === 0) {
        // Create default app settings
        await base44.asServiceRole.entities.AppSettings.create({
          default_language: 'fr',
          timezone: 'America/Toronto',
          date_format: 'DD/MM/YYYY',
          currency: 'CAD',
          menu_modules: {
            dashboard: true,
            jobs: true,
            customers: true,
            team: true,
            schedule: true,
            invoices: true
          }
        });
        setupResults.entities_created.push('AppSettings (default configuration)');
      }
    } catch (error) {
      console.log('AppSettings check/create failed:', error.message);
    }

    // Final status
    setupResults.success = setupResults.errors.filter(e => e.priority === 'critical').length === 0;
    setupResults.summary = {
      total_entities: criticalEntities.length + coreEntities.length,
      critical_entities_checked: criticalEntities.filter(e => e.priority === 'critical').length,
      critical_errors: setupResults.errors.filter(e => e.priority === 'critical').length,
      optional_missing: setupResults.entities_verified.filter(e => e.status === 'missing').length,
      recommendations: []
    };

    if (setupResults.errors.length > 0) {
      setupResults.summary.recommendations.push(
        'Review errors above and create missing critical entities in Base44 Dashboard'
      );
    }

    if (setupResults.summary.critical_errors === 0) {
      setupResults.summary.recommendations.push(
        'All critical entities are properly configured'
      );
    }

    return setupResults;

  } catch (error) {
    console.error('Database setup error:', error);
    return {
      success: false,
      error: error.message || 'Database setup failed',
      details: error.stack
    };
  }
}

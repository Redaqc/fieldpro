import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Background Sync Scheduler
 * Executes scheduled synchronizations for Zoho Books and Sage 50
 * Should be triggered via cron job or scheduled task
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active integrations with auto-sync enabled
    const integrations = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      is_active: true,
      auto_sync_enabled: true
    });

    const results = [];

    for (const integration of integrations) {
      const now = new Date();
      const lastSync = integration.last_auto_sync ? new Date(integration.last_auto_sync) : null;
      
      let shouldSync = false;

      // Check if sync is due based on frequency
      if (integration.sync_frequency === 'hourly') {
        if (!lastSync || (now - lastSync) >= 3600000) { // 1 hour
          shouldSync = true;
        }
      } else if (integration.sync_frequency === 'daily') {
        if (!lastSync || (now - lastSync) >= 86400000) { // 24 hours
          const syncTime = integration.sync_time || '02:00';
          const [hours, minutes] = syncTime.split(':');
          const targetTime = new Date(now);
          targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Sync if we're within 5 minutes of target time
          if (Math.abs(now - targetTime) <= 300000) {
            shouldSync = true;
          }
        }
      } else if (integration.sync_frequency === 'weekly') {
        if (!lastSync || (now - lastSync) >= 604800000) { // 7 days
          shouldSync = true;
        }
      }

      if (!shouldSync) {
        continue;
      }

      const syncResult = {
        integration_id: integration.id,
        integration_type: integration.integration_type,
        operations: []
      };

      try {
        // Sync customers
        if (integration.sync_customers) {
          try {
            const customerSync = integration.integration_type === 'zoho_books'
              ? await base44.asServiceRole.functions.invoke('zohoSyncCustomers')
              : null;

            syncResult.operations.push({
              type: 'customers',
              status: 'success',
              result: customerSync?.data
            });
          } catch (error) {
            syncResult.operations.push({
              type: 'customers',
              status: 'error',
              error: error.message
            });
          }
        }

        // Sync invoices
        if (integration.sync_invoices) {
          try {
            const invoiceSync = integration.integration_type === 'zoho_books'
              ? await base44.asServiceRole.functions.invoke('zohoSyncInvoices')
              : null;

            syncResult.operations.push({
              type: 'invoices',
              status: 'success',
              result: invoiceSync?.data
            });
          } catch (error) {
            syncResult.operations.push({
              type: 'invoices',
              status: 'error',
              error: error.message
            });
          }
        }

        // Update last sync time
        await base44.asServiceRole.entities.IntegrationSettings.update(integration.id, {
          last_auto_sync: now.toISOString()
        });

        // Check for errors and send notifications
        const hasErrors = syncResult.operations.some(op => op.status === 'error');
        
        if (hasErrors && integration.notify_on_errors) {
          // Get admin users
          const users = await base44.asServiceRole.entities.User.list();
          const admins = users.filter(u => u.role === 'admin');

          for (const admin of admins) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: admin.email,
              type: 'integration_error',
              title: `Erreur de synchronisation ${integration.integration_type}`,
              message: `La synchronisation automatique a échoué. Consultez les logs pour plus de détails.`,
              read: false,
              data: { integration_id: integration.id, errors: syncResult.operations.filter(op => op.status === 'error') }
            });
          }
        }

        results.push(syncResult);

      } catch (error) {
        syncResult.error = error.message;
        results.push(syncResult);

        // Send error notification
        if (integration.notify_on_errors) {
          const users = await base44.asServiceRole.entities.User.list();
          const admins = users.filter(u => u.role === 'admin');

          for (const admin of admins) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: admin.email,
              type: 'integration_error',
              title: `Erreur critique de synchronisation`,
              message: `La synchronisation ${integration.integration_type} a échoué: ${error.message}`,
              read: false
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      synced_integrations: results.length,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
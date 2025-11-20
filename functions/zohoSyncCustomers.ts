import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Zoho Books Customer Sync (Two-way)
 * Syncs customers between Zoho Books and the system
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create sync log
    const syncLog = await base44.asServiceRole.entities.SyncLog.create({
      integration_type: 'zoho_books',
      operation: 'sync_customers',
      status: 'in_progress',
      started_at: new Date().toISOString()
    });

    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    try {
      // Get Zoho settings
      const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
        integration_type: 'zoho_books',
        is_active: true 
      });

      if (settings.length === 0) {
        throw new Error('Zoho Books not connected');
      }

      const { zoho_organization_id, zoho_access_token } = settings[0];

      // Fetch customers from Zoho
      const zohoResponse = await fetch(
        `https://www.zohoapis.com/books/v3/contacts?organization_id=${zoho_organization_id}`,
        {
          headers: { 'Authorization': `Zoho-oauthtoken ${zoho_access_token}` }
        }
      );

      const zohoData = await zohoResponse.json();

      if (zohoData.code !== 0) {
        throw new Error(zohoData.message || 'Failed to fetch Zoho customers');
      }

      const zohoCustomers = zohoData.contacts || [];

      // Get existing customers
      const existingCustomers = await base44.asServiceRole.entities.Customer.list();

      for (const zohoCustomer of zohoCustomers) {
        recordsProcessed++;

        try {
          // Find matching customer by email or name
          const match = existingCustomers.find(c => 
            c.email === zohoCustomer.email || 
            (c.first_name === zohoCustomer.first_name && c.last_name === zohoCustomer.last_name)
          );

          const customerData = {
            first_name: zohoCustomer.first_name || zohoCustomer.contact_name?.split(' ')[0] || '',
            last_name: zohoCustomer.last_name || zohoCustomer.contact_name?.split(' ').slice(1).join(' ') || '',
            email: zohoCustomer.email,
            phone: zohoCustomer.phone,
            company_name: zohoCustomer.company_name,
            address: zohoCustomer.billing_address?.address,
            city: zohoCustomer.billing_address?.city,
            state: zohoCustomer.billing_address?.state,
            zip_code: zohoCustomer.billing_address?.zip,
          };

          if (match) {
            await base44.asServiceRole.entities.Customer.update(match.id, customerData);
            recordsUpdated++;
          } else {
            await base44.asServiceRole.entities.Customer.create(customerData);
            recordsCreated++;
          }
        } catch (err) {
          recordsFailed++;
          console.error(`Failed to sync customer ${zohoCustomer.contact_id}:`, err);
        }
      }

      // Update settings with last sync time
      await base44.asServiceRole.entities.IntegrationSettings.update(settings[0].id, {
        last_sync_customers: new Date().toISOString()
      });

      // Update sync log
      await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
        status: 'success',
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        completed_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        processed: recordsProcessed,
        created: recordsCreated,
        updated: recordsUpdated,
        failed: recordsFailed
      });

    } catch (error) {
      // Update sync log with error
      await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
        status: 'error',
        error_message: error.message,
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        completed_at: new Date().toISOString()
      });

      throw error;
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
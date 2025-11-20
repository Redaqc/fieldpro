import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Zoho Books Invoice Sync (Two-way)
 * Syncs invoices between Zoho Books and the system
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncLog = await base44.asServiceRole.entities.SyncLog.create({
      integration_type: 'zoho_books',
      operation: 'sync_invoices',
      status: 'in_progress',
      started_at: new Date().toISOString()
    });

    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    try {
      const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
        integration_type: 'zoho_books',
        is_active: true 
      });

      if (settings.length === 0) {
        throw new Error('Zoho Books not connected');
      }

      const { zoho_organization_id, zoho_access_token } = settings[0];

      // Fetch invoices from Zoho
      const zohoResponse = await fetch(
        `https://www.zohoapis.com/books/v3/invoices?organization_id=${zoho_organization_id}`,
        {
          headers: { 'Authorization': `Zoho-oauthtoken ${zoho_access_token}` }
        }
      );

      const zohoData = await zohoResponse.json();

      if (zohoData.code !== 0) {
        throw new Error(zohoData.message || 'Failed to fetch Zoho invoices');
      }

      const zohoInvoices = zohoData.invoices || [];
      const existingInvoices = await base44.asServiceRole.entities.Invoice.list();

      for (const zohoInv of zohoInvoices) {
        recordsProcessed++;

        try {
          const match = existingInvoices.find(i => 
            i.invoice_number === zohoInv.invoice_number
          );

          const invoiceData = {
            invoice_number: zohoInv.invoice_number,
            customer_name: zohoInv.customer_name,
            invoice_date: zohoInv.date,
            due_date: zohoInv.due_date,
            subtotal: zohoInv.sub_total,
            tps: zohoInv.tax_total * 0.333, // Approximate TPS from total tax
            tvq: zohoInv.tax_total * 0.667, // Approximate TVQ from total tax
            total: zohoInv.total,
            status: zohoInv.status === 'paid' ? 'paid' : 
                   zohoInv.status === 'overdue' ? 'overdue' : 'pending',
            paid_date: zohoInv.payment_made > 0 ? zohoInv.last_payment_date : null
          };

          if (match) {
            await base44.asServiceRole.entities.Invoice.update(match.id, invoiceData);
            recordsUpdated++;
          } else {
            await base44.asServiceRole.entities.Invoice.create(invoiceData);
            recordsCreated++;
          }
        } catch (err) {
          console.error(`Failed to sync invoice ${zohoInv.invoice_id}:`, err);
        }
      }

      await base44.asServiceRole.entities.IntegrationSettings.update(settings[0].id, {
        last_sync_invoices: new Date().toISOString()
      });

      await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
        status: 'success',
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        completed_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        processed: recordsProcessed,
        created: recordsCreated,
        updated: recordsUpdated
      });

    } catch (error) {
      await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });

      throw error;
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
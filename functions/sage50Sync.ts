import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Sage 50 Canada Sync Handler
 * Handles CSV-based sync with Sage 50 Canada
 * Supports customers, items, and invoices
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, csv_data } = await req.json();

    if (!operation) {
      return Response.json({ error: 'operation required' }, { status: 400 });
    }

    const syncLog = await base44.asServiceRole.entities.SyncLog.create({
      integration_type: 'sage50',
      operation: `sync_${operation}`,
      status: 'in_progress',
      started_at: new Date().toISOString()
    });

    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    try {
      if (operation === 'customers' && csv_data) {
        // Parse CSV data
        const lines = csv_data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          recordsProcessed++;
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, idx) => row[h] = values[idx]);

          try {
            const existingCustomers = await base44.asServiceRole.entities.Customer.filter({
              email: row.email || row.e_mail
            });

            const customerData = {
              first_name: row.first_name || row.firstname || '',
              last_name: row.last_name || row.lastname || '',
              email: row.email || row.e_mail,
              phone: row.phone || row.telephone,
              company_name: row.company || row.company_name,
              address: row.address || row.street,
              city: row.city,
              state: row.province || row.state,
              zip_code: row.postal_code || row.zip
            };

            if (existingCustomers.length > 0) {
              await base44.asServiceRole.entities.Customer.update(existingCustomers[0].id, customerData);
              recordsUpdated++;
            } else {
              await base44.asServiceRole.entities.Customer.create(customerData);
              recordsCreated++;
            }
          } catch (err) {
            recordsFailed++;
            console.error('Failed to import customer:', err);
          }
        }
      }

      if (operation === 'items' && csv_data) {
        const lines = csv_data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          recordsProcessed++;
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, idx) => row[h] = values[idx]);

          try {
            const existingItems = await base44.asServiceRole.entities.Material.filter({
              sku: row.item_code || row.sku
            });

            const itemData = {
              name: row.item_name || row.name || row.description,
              sku: row.item_code || row.sku,
              unit_price: parseFloat(row.price || row.unit_price || 0),
              description: row.description
            };

            if (existingItems.length > 0) {
              await base44.asServiceRole.entities.Material.update(existingItems[0].id, itemData);
              recordsUpdated++;
            } else {
              await base44.asServiceRole.entities.Material.create(itemData);
              recordsCreated++;
            }
          } catch (err) {
            recordsFailed++;
            console.error('Failed to import item:', err);
          }
        }
      }

      if (operation === 'invoices' && csv_data) {
        const lines = csv_data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          recordsProcessed++;
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, idx) => row[h] = values[idx]);

          try {
            const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
              invoice_number: row.invoice_number || row.invoice_no
            });

            const invoiceData = {
              invoice_number: row.invoice_number || row.invoice_no,
              customer_name: row.customer_name || row.customer,
              invoice_date: row.invoice_date || row.date,
              due_date: row.due_date,
              subtotal: parseFloat(row.subtotal || 0),
              tps: parseFloat(row.gst || row.tps || 0),
              tvq: parseFloat(row.pst || row.tvq || 0),
              total: parseFloat(row.total || 0),
              status: row.status || 'pending'
            };

            if (existingInvoices.length > 0) {
              await base44.asServiceRole.entities.Invoice.update(existingInvoices[0].id, invoiceData);
              recordsUpdated++;
            } else {
              await base44.asServiceRole.entities.Invoice.create(invoiceData);
              recordsCreated++;
            }
          } catch (err) {
            recordsFailed++;
            console.error('Failed to import invoice:', err);
          }
        }
      }

      // Export invoice to CSV
      if (operation === 'export_invoice') {
        const { invoice_id } = await req.json();
        
        const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
        
        if (invoices.length === 0) {
          throw new Error('Invoice not found');
        }

        const invoice = invoices[0];

        // Generate CSV export
        const csvLines = [
          'Invoice Number,Customer,Date,Due Date,Subtotal,TPS,TVQ,Total,Status',
          `${invoice.invoice_number},${invoice.customer_name},${invoice.invoice_date},${invoice.due_date},${invoice.subtotal},${invoice.tps},${invoice.tvq},${invoice.total},${invoice.status}`
        ];

        return Response.json({
          success: true,
          csv: csvLines.join('\n'),
          filename: `invoice_${invoice.invoice_number}.csv`
        });
      }

      const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ integration_type: 'sage50' });
      
      if (settings.length > 0) {
        await base44.asServiceRole.entities.IntegrationSettings.update(settings[0].id, {
          [`last_sync_${operation}`]: new Date().toISOString()
        });
      }

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
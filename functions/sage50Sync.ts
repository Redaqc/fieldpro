import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Sage 50 Canada Sync Handler
 * Supports both SDK (COM API) and CSV-based sync
 * SDK mode provides direct query capabilities and real-time data exchange
 * CSV mode serves as fallback for environments without COM access
 */

// SDK Helper Functions for Sage 50 COM API
const Sage50SDK = {
  /**
   * Initialize connection to Sage 50 via COM API
   * Note: COM API only works on Windows environments with Sage 50 installed
   */
  async connect(companyPath) {
    try {
      // In a real implementation, this would use a Windows COM bridge
      // For Deno, we'd need to use FFI or an external Windows service
      // This is a placeholder for the SDK structure
      
      const connectionString = `Provider=PCSOFT.SDK;Data Source=${companyPath}`;
      
      return {
        connected: true,
        companyPath,
        connectionString
      };
    } catch (error) {
      throw new Error(`Sage 50 SDK connection failed: ${error.message}`);
    }
  },

  /**
   * Query customers from Sage 50
   */
  async queryCustomers(connection, filters = {}) {
    try {
      // In production, this would execute actual COM queries
      // Example: SELECT * FROM ARCUS WHERE ...
      
      const query = {
        table: 'ARCUS', // Customer table
        fields: ['IDCUST', 'NAMECUST', 'TEXTSTRE1', 'TEXTSTRE2', 'NAMECITY', 'CODESTTE', 'CODEPSTL', 'EMAIL'],
        filters: filters
      };

      // Placeholder - actual implementation would use COM interop
      throw new Error('SDK mode requires COM API access - use CSV mode or configure Windows service bridge');
      
    } catch (error) {
      throw new Error(`Customer query failed: ${error.message}`);
    }
  },

  /**
   * Query inventory items from Sage 50
   */
  async queryItems(connection, filters = {}) {
    try {
      const query = {
        table: 'ICITM', // Inventory table
        fields: ['ITEMNO', 'DESC', 'ITEMPRIC', 'QTYONHAND'],
        filters: filters
      };

      throw new Error('SDK mode requires COM API access - use CSV mode or configure Windows service bridge');
      
    } catch (error) {
      throw new Error(`Item query failed: ${error.message}`);
    }
  },

  /**
   * Query invoices from Sage 50
   */
  async queryInvoices(connection, filters = {}) {
    try {
      const query = {
        table: 'AROBL', // Invoice table
        fields: ['IDINVC', 'IDCUST', 'DATEINVC', 'AMTINVCTOT', 'AMTPAID'],
        filters: filters
      };

      throw new Error('SDK mode requires COM API access - use CSV mode or configure Windows service bridge');
      
    } catch (error) {
      throw new Error(`Invoice query failed: ${error.message}`);
    }
  },

  /**
   * Create customer in Sage 50
   */
  async createCustomer(connection, customerData) {
    try {
      // Would execute INSERT via COM API
      throw new Error('SDK mode requires COM API access - use CSV mode or configure Windows service bridge');
    } catch (error) {
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  },

  /**
   * Update customer in Sage 50
   */
  async updateCustomer(connection, customerId, customerData) {
    try {
      // Would execute UPDATE via COM API
      throw new Error('SDK mode requires COM API access - use CSV mode or configure Windows service bridge');
    } catch (error) {
      throw new Error(`Customer update failed: ${error.message}`);
    }
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, csv_data, mode } = await req.json();

    if (!operation) {
      return Response.json({ error: 'operation required' }, { status: 400 });
    }

    // Get integration settings
    const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      integration_type: 'sage50' 
    });
    
    const sage50Settings = settings[0];
    const syncMode = mode || sage50Settings?.sage50_sync_mode || 'csv';

    const syncLog = await base44.asServiceRole.entities.SyncLog.create({
      integration_type: 'sage50',
      operation: `sync_${operation}`,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      details: { mode: syncMode }
    });

    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors = [];

    try {
      // SDK Mode
      if (syncMode === 'sdk') {
        if (!sage50Settings?.sage50_company_path) {
          throw new Error('Sage 50 company path not configured');
        }

        let connection;
        try {
          connection = await Sage50SDK.connect(sage50Settings.sage50_company_path);
          
          // Get filters from settings
          const customerFilters = sage50Settings.customer_filters || {};
          const itemFilters = sage50Settings.item_filters || {};
          const invoiceFilters = sage50Settings.invoice_filters || {};
          const dateRange = {
            start: sage50Settings.historical_sync_start_date,
            end: sage50Settings.historical_sync_end_date
          };

          if (operation === 'customers') {
            const sage50Customers = await Sage50SDK.queryCustomers(connection, customerFilters);
            
            for (const sage50Customer of sage50Customers) {
              recordsProcessed++;
              try {
                const existingCustomers = await base44.asServiceRole.entities.Customer.filter({
                  email: sage50Customer.email
                });

                const customerData = {
                  first_name: sage50Customer.first_name || '',
                  last_name: sage50Customer.last_name || '',
                  email: sage50Customer.email,
                  phone: sage50Customer.phone,
                  company_name: sage50Customer.company_name,
                  address: sage50Customer.address,
                  city: sage50Customer.city,
                  state: sage50Customer.state,
                  zip_code: sage50Customer.zip_code
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
                errors.push({ record: sage50Customer, error: err.message });
              }
            }
          }

          if (operation === 'items') {
            const sage50Items = await Sage50SDK.queryItems(connection, itemFilters);
            
            for (const sage50Item of sage50Items) {
              recordsProcessed++;
              try {
                const existingItems = await base44.asServiceRole.entities.Material.filter({
                  sku: sage50Item.item_code
                });

                const itemData = {
                  name: sage50Item.name,
                  sku: sage50Item.item_code,
                  unit_price: sage50Item.price,
                  description: sage50Item.description,
                  quantity: sage50Item.quantity
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
                errors.push({ record: sage50Item, error: err.message });
              }
            }
          }

          if (operation === 'invoices') {
            const sage50Invoices = await Sage50SDK.queryInvoices(connection, {
              ...invoiceFilters,
              dateRange
            });
            
            for (const sage50Invoice of sage50Invoices) {
              recordsProcessed++;
              try {
                const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
                  invoice_number: sage50Invoice.invoice_number
                });

                const invoiceData = {
                  invoice_number: sage50Invoice.invoice_number,
                  customer_name: sage50Invoice.customer_name,
                  invoice_date: sage50Invoice.invoice_date,
                  due_date: sage50Invoice.due_date,
                  subtotal: sage50Invoice.subtotal,
                  tps: sage50Invoice.tps,
                  tvq: sage50Invoice.tvq,
                  total: sage50Invoice.total,
                  status: sage50Invoice.status
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
                errors.push({ record: sage50Invoice, error: err.message });
              }
            }
          }

        } catch (sdkError) {
          // If SDK fails, log and suggest CSV fallback
          await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
            status: 'error',
            error_message: `SDK Error: ${sdkError.message}. Consider using CSV mode as fallback.`,
            completed_at: new Date().toISOString()
          });

          return Response.json({
            error: sdkError.message,
            suggestion: 'SDK mode not available. Please use CSV mode or configure Windows COM bridge.',
            mode: 'sdk'
          }, { status: 500 });
        }
      }
      // CSV Mode (existing implementation)
      else {
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
            errors.push({ row: i, error: err.message });
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
            errors.push({ row: i, error: err.message });
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
            errors.push({ row: i, error: err.message });
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
          filename: `invoice_${invoice.invoice_number}.csv`,
          mode: 'csv'
        });
        }
      }
      
      if (sage50Settings) {
        await base44.asServiceRole.entities.IntegrationSettings.update(sage50Settings.id, {
          [`last_sync_${operation}`]: new Date().toISOString()
        });
      }

      await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
        status: 'success',
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        details: { mode: syncMode, errors: errors.slice(0, 10) },
        completed_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        mode: syncMode,
        processed: recordsProcessed,
        created: recordsCreated,
        updated: recordsUpdated,
        failed: recordsFailed,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined
      });

    } catch (error) {
      await base44.asServiceRole.entities.SyncLog.update(syncLog.id, {
        status: 'error',
        error_message: error.message,
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        details: { mode: syncMode, errors: errors.slice(0, 10) },
        completed_at: new Date().toISOString()
      });

      // Send notification on error
      if (sage50Settings?.notify_on_errors) {
        const users = await base44.asServiceRole.entities.User.list();
        const admins = users.filter(u => u.role === 'admin');

        for (const admin of admins) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: admin.email,
            type: 'integration_error',
            title: 'Erreur Sage 50 Sync',
            message: `Erreur lors de la synchronisation ${operation}: ${error.message}`,
            read: false,
            data: { operation, mode: syncMode, error: error.message }
          });
        }
      }

      throw error;
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
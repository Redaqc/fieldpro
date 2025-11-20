import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * QuickBooks Integration
 * Syncs customers and invoices with QuickBooks Online
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    // Get QuickBooks integration settings
    const integrations = await base44.asServiceRole.entities.Integration.filter({
      type: 'quickbooks',
      status: 'active'
    });

    const qbIntegration = integrations[0];
    if (!qbIntegration) {
      return Response.json({ error: 'QuickBooks not connected' }, { status: 400 });
    }

    const { access_token, realm_id } = qbIntegration.credentials;
    const baseUrl = `https://quickbooks.api.intuit.com/v3/company/${realm_id}`;

    switch (action) {
      case 'sync_customers': {
        const customers = await base44.asServiceRole.entities.Customer.list();
        let synced = 0;

        for (const customer of customers) {
          if (customer.quickbooks_id) continue; // Already synced

          const qbCustomer = {
            DisplayName: `${customer.first_name} ${customer.last_name}`,
            PrimaryEmailAddr: { Address: customer.email },
            PrimaryPhone: { FreeFormNumber: customer.phone },
            BillAddr: {
              Line1: customer.address,
              City: customer.city,
              CountrySubDivisionCode: customer.state,
              PostalCode: customer.zip_code
            }
          };

          const response = await fetch(`${baseUrl}/customer`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(qbCustomer)
          });

          if (response.ok) {
            const result = await response.json();
            await base44.asServiceRole.entities.Customer.update(customer.id, {
              quickbooks_id: result.Customer.Id
            });
            synced++;
          }
        }

        return Response.json({ synced, total: customers.length });
      }

      case 'sync_invoice': {
        const invoice = data;
        const customer = await base44.asServiceRole.entities.Customer.filter({ id: invoice.customer_id });

        if (!customer[0]?.quickbooks_id) {
          return Response.json({ error: 'Customer not synced to QuickBooks' }, { status: 400 });
        }

        const qbInvoice = {
          CustomerRef: { value: customer[0].quickbooks_id },
          Line: invoice.line_items.map(item => ({
            Amount: item.total,
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: {
              ItemRef: { value: '1' }, // Default service item
              Qty: item.quantity,
              UnitPrice: item.unit_price
            },
            Description: item.description
          }))
        };

        const response = await fetch(`${baseUrl}/invoice`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(qbInvoice)
        });

        if (response.ok) {
          const result = await response.json();
          return Response.json({ quickbooks_invoice_id: result.Invoice.Id });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
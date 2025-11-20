import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Create Invoice in Zoho Books
 * Creates an invoice from system data into Zoho Books with TPS/TVQ calculation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return Response.json({ error: 'invoice_id required' }, { status: 400 });
    }

    const settings = await base44.asServiceRole.entities.IntegrationSettings.filter({ 
      integration_type: 'zoho_books',
      is_active: true 
    });

    if (settings.length === 0) {
      return Response.json({ error: 'Zoho Books not connected' }, { status: 400 });
    }

    const { zoho_organization_id, zoho_access_token } = settings[0];

    // Get invoice from system
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    
    if (invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Calculate taxes
    const subtotal = invoice.subtotal || 0;
    const tps = subtotal * 0.05; // 5%
    const tvq = subtotal * 0.09975; // 9.975%
    const total = subtotal + tps + tvq;

    // Prepare Zoho invoice data
    const zohoInvoice = {
      customer_name: invoice.customer_name,
      invoice_number: invoice.invoice_number,
      date: invoice.invoice_date || new Date().toISOString().split('T')[0],
      due_date: invoice.due_date,
      line_items: (invoice.items || []).map(item => ({
        name: item.description,
        quantity: item.quantity || 1,
        rate: item.unit_price || 0,
        tax_id: null // Will be set by Zoho based on tax setup
      })),
      notes: invoice.notes || '',
      tax_authority_id: null, // Auto-calculated by Zoho
      is_inclusive_tax: false
    };

    // Create invoice in Zoho
    const zohoResponse = await fetch(
      `https://www.zohoapis.com/books/v3/invoices?organization_id=${zoho_organization_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${zoho_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(zohoInvoice)
      }
    );

    const zohoData = await zohoResponse.json();

    if (zohoData.code !== 0) {
      return Response.json({ error: zohoData.message }, { status: 400 });
    }

    // Update system invoice with Zoho ID
    await base44.asServiceRole.entities.Invoice.update(invoice_id, {
      tps,
      tvq,
      total,
      zoho_invoice_id: zohoData.invoice.invoice_id
    });

    return Response.json({
      success: true,
      zoho_invoice_id: zohoData.invoice.invoice_id,
      invoice_url: `https://books.zoho.com/app#/invoices/${zohoData.invoice.invoice_id}`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});